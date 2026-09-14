"use server";

import { db } from "@/drizzle/db";
import { restaurant } from "@/drizzle/schema";
import { logMerchantActivity } from "@/lib/activity/log";
import { ensureAuthenticatedUser } from "@/lib/auth/guards";
import {
  PlatformEmailProps,
  publishEmailToQueue,
  RestaurantEmailProps,
} from "@/lib/email-publisher";
import { SmtpConfig } from "@/lib/email/types";
import { limitUserAction } from "@/lib/rate-limit/guard";
import { toPublicSmtpConfig } from "@/lib/security/public-config";
import { decrypt, encrypt } from "@/lib/stripe/encryption";
import { ApiResponse } from "@/lib/types";
import { SmtpTestInput, smtpTestSchema } from "@/lib/validators/zod/smtp";
import { eq } from "drizzle-orm";
import { buildEmail } from "./build-email";
import { getTestDataForTemplate } from "./test-data";
import { EmailTemplates } from "./types";
import { renderTemplate, validateTemplates } from "./utils";
import { canUseCustomSmtp, canUseEmail } from "@/lib/stripe/checkers";

type AcionReturnType = {
  email_templates: EmailTemplates;
};

export async function updateRestaurantEmailTemplatesAction(
  input: EmailTemplates,
): Promise<ApiResponse<AcionReturnType>> {
  const { session } = await ensureAuthenticatedUser();

  if (!session) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  if (!canUseEmail(session?.user?.subscription?.plan ?? "starter")) {
    return { success: false, error: "Email features are not available on your plan." };
  }

  const { valid, error } = validateTemplates(input);
  if (!valid) {
    return {
      success: false,
      error: error ?? "Invalid input",
    };
  }

  const data = input;

  const [updatedRestaurant] = await db
    .update(restaurant)
    .set({
      email_templates: data,
      updatedAt: new Date(),
    })
    .where(eq(restaurant.id, session.user.activeRestaurantId))
    .returning({
      email_templates: restaurant.email_templates,
    });

  logMerchantActivity(session.user, {
    type: "settings.email_updated",
    data: {},
  });

  return {
    success: true,
    data: updatedRestaurant,
  };
}

export async function sendTestTemplateEmail(
  templateKey: keyof EmailTemplates,
): Promise<ApiResponse<{ message: string }>> {
  const { session } = await ensureAuthenticatedUser();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  // Before any lookup or queueing: every call sends a real email.
  const limit = await limitUserAction("smtp-test-email", session.user.id, "testEmail");
  if (!limit.allowed) {
    return { success: false, error: "Too many test emails. Please wait a moment and try again." };
  }

  const restaurantRecord = await db.query.restaurant.findFirst({
    where: eq(restaurant.id, session.user.activeRestaurantId),
    columns: {
      name: true,
      email_config: true,
      email_templates: true,
    },
  });

  if (!restaurantRecord) {
    return { success: false, error: "Restaurant not found" };
  }

  const plan = session?.user?.subscription?.plan ?? "starter";

  if (!canUseEmail(plan)) {
    return { success: false, error: "Email features are not available on your current plan." };
  }

  const { email_config, email_templates, name: businessName } = restaurantRecord;

  const template = email_templates?.[templateKey];
  if (!template) {
    return { success: false, error: "Template not found" };
  }

  const testData = getTestDataForTemplate(templateKey, businessName);
  const { subject, body } = renderTemplate(template, testData);
  const fullHtml = buildEmail(body, subject);

  let emailPayload: PlatformEmailProps | RestaurantEmailProps;
  const isCustomAllowed = canUseCustomSmtp(plan);
  const hasValidSmtp = email_config && email_config.isVerified && email_config.testEmail;

  if (isCustomAllowed && hasValidSmtp) {
    emailPayload = {
      type: "restaurant",
      to: email_config.testEmail ?? session?.user?.email,
      subject,
      html: fullHtml,
      smtpHost: email_config.smtpHost,
      smtpPort: email_config.smtpPort,
      smtpSecure: email_config.smtpSecure,
      smtpUsername: email_config.smtpUsername,
      smtpPassword: decrypt(email_config.smtpPassword),
      fromEmail: email_config.fromEmail,
      fromName: email_config.fromName || undefined,
    };
  } else {
    emailPayload = {
      type: "platform",
      to: session.user.email,
      subject,
      html: fullHtml,
    };
  }

  const result = await publishEmailToQueue(emailPayload);
  if (!result.success) {
    return { success: false, error: result.error || "Failed to send test email" };
  }

  return { success: true, data: { message: "Test email sent successfully" } };
}

export async function testSmtpConfig(
  input: SmtpTestInput,
): Promise<ApiResponse<{ message: string }>> {
  const { session } = await ensureAuthenticatedUser();

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  if (!canUseCustomSmtp(session?.user?.subscription?.plan ?? "starter")) {
    return { success: false, error: "Custom SMTP is not allowed on your current plan." };
  }

  const limit = await limitUserAction("smtp-test-config", session.user.id, "smtpTest");
  if (!limit.allowed) {
    return { success: false, error: "Too many SMTP tests. Please wait a few minutes and try again." };
  }

  const validation = smtpTestSchema.safeParse(input);

  if (!validation.success) {
    return { success: false, error: "Validation failed" };
  }
  const {
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUsername,
    smtpPassword,
    fromEmail,
    fromName,
    testEmail,
  } = validation.data;

  // 4-digit code
  const code = Math.floor(1000 + Math.random() * 9000).toString();

  // payload for email server
  const emailPayload: RestaurantEmailProps = {
    type: "restaurant" as const,
    to: testEmail,
    subject: "Your verification code",
    html: `<p>Your verification code is: <strong>${code}</strong></p><p>It expires in 5 minutes.</p>`,
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUsername,
    smtpPassword,
    fromEmail,
    fromName: fromName || undefined,
  };

  // Send via email server using our publisher
  const result = await publishEmailToQueue(emailPayload);
  if (!result.success) {
    return { success: false, error: result.error || "Failed to send verification email" };
  }

  // config (encrypt password for storage)
  const encryptedPassword = encrypt(smtpPassword);
  const config: SmtpConfig = {
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUsername,
    smtpPassword: encryptedPassword,
    fromEmail,
    fromName: fromName || null,
    testEmail,
    isVerified: false,
    lastError: null,
  };

  // Store pending config and code with expiry (5 min)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await db
    .update(restaurant)
    .set({
      pendingEmailConfig: config,
      verificationCode: code,
      verificationExpiresAt: expiresAt,
    })
    .where(eq(restaurant.id, session.user.activeRestaurantId));

  return { success: true, data: { message: "Verification code sent to your email" } };
}

export async function verifySmtpCode(
  code: string,
): Promise<ApiResponse<{ email_config: SmtpConfig | null; isEmailIntegrationDone: boolean }>> {
  const { session } = await ensureAuthenticatedUser();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  if (!canUseCustomSmtp(session?.user?.subscription?.plan ?? "starter")) {
    return { success: false, error: "Custom SMTP is not allowed on your current plan." };
  }


  const limit = await limitUserAction("smtp-verify-code", session.user.id, "smtpVerify");
  if (!limit.allowed) {
    return { success: false, error: "Too many verification attempts. Please wait a few minutes and try again." };
  }

  if (!code || code.length !== 4) {
    return { success: false, error: "Invalid code format" };
  }

  const restaurantRecord = await db.query.restaurant.findFirst({
    where: eq(restaurant.id, session.user.activeRestaurantId),
    columns: {
      pendingEmailConfig: true,
      verificationCode: true,
      verificationExpiresAt: true,
    },
  });

  if (
    !restaurantRecord ||
    !restaurantRecord.pendingEmailConfig ||
    !restaurantRecord.verificationCode ||
    !restaurantRecord.verificationExpiresAt
  ) {
    return { success: false, error: "No pending verification" };
  }

  // Check expiry
  if (new Date() > restaurantRecord.verificationExpiresAt) {
    // Clear pending data
    await db
      .update(restaurant)
      .set({
        pendingEmailConfig: null,
        verificationCode: null,
        verificationExpiresAt: null,
      })
      .where(eq(restaurant.id, session.user.activeRestaurantId));
    return { success: false, error: "Verification code expired" };
  }

  // Check code
  if (restaurantRecord.verificationCode !== code) {
    return { success: false, error: "Invalid code" };
  }

  // Code is correct ===> save permanent config
  const config = {
    ...restaurantRecord.pendingEmailConfig,
    isVerified: true,
    lastVerifiedAt: new Date().toISOString(),
  };

  const record = await db
    .update(restaurant)
    .set({
      email_config: config,
      isEmailIntegrationDone: true,
      pendingEmailConfig: null,
      verificationCode: null,
      verificationExpiresAt: null,
    })
    .where(eq(restaurant.id, session.user.activeRestaurantId))
    .returning({
      email_config: restaurant.email_config,
      isEmailIntegrationDone: restaurant.isEmailIntegrationDone,
    });

  if (!record[0]) return { success: false, error: "Invalid code" };

  return {
    success: true,
    data: {
      email_config: toPublicSmtpConfig(record[0].email_config),
      isEmailIntegrationDone: record[0].isEmailIntegrationDone,
    },
  };
}
