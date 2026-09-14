"use server";

import { db } from "@/drizzle/db";
import { restaurant } from "@/drizzle/schema";
import { logMerchantActivity } from "@/lib/activity/log";
import { ensureAuthenticatedUser } from "@/lib/auth/guards";
import { getValidStripeClient } from "@/lib/stripe";
import { toPublicStripeConfig } from "@/lib/security/public-config";
import { decrypt, encrypt } from "@/lib/stripe/encryption";
import { StripeConfig } from "@/lib/stripe/types";
import { ApiResponse } from "@/lib/types";
import { eq } from "drizzle-orm";
import { STRIPE_WEBHOOK_EVENTS, StripeConfigSchema, StripeConfigSchemaValues } from "./schema";

type UpdateRestaurantStripeAction = {
  stripe: StripeConfig | null;
};

export async function updateRestaurantStripeAction(
  input: StripeConfigSchemaValues,
): Promise<ApiResponse<UpdateRestaurantStripeAction | null>> {
  const { session } = await ensureAuthenticatedUser();

  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = StripeConfigSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const data = parsed.data;

  const existing = await db.query.restaurant.findFirst({
    where: eq(restaurant.id, session.user.activeRestaurantId),
    columns: {
      stripe: true,
    },
  });

  const currentStripe = existing?.stripe ?? null;

  if (currentStripe?.currency && currentStripe.currency !== data.currency) {
    return {
      success: false,
      error: "Billing currency is permanent and cannot be changed after initial setup.",
    };
  }

  let encryptedSecret = currentStripe?.secret ?? null;

  let encryptedWebhookSecret = currentStripe?.webhook_secret;

  let webhookId = currentStripe?.webhook_id ?? null;

  let secretConfigured = currentStripe?.secret_configured ?? false;

  let webhookConfigured = currentStripe?.webhook_configured ?? false;

  const secretChanged = Boolean(data.secret?.trim());

  if (secretChanged) {
    try {
      // validate key with Stripe
      const stripeClient = await getValidStripeClient(data.secret!);

      if (!stripeClient) {
        return {
          success: false,
          error:
            "Unable to connect to Stripe. Please verify that your secret key is valid and matches the environment (live or test).",
        };
      }

      // validate test/live match
      const isSecretTest = data.secret!.startsWith("sk_test_");

      const isPublishableTest = data.publishable.startsWith("pk_test_");

      if (isSecretTest !== isPublishableTest) {
        return {
          success: false,
          error: "Publishable and secret keys do not belong to the same mode",
        };
      }

      const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
      const webhookUrl = `${baseUrl}/api/stripe/${session.user.activeRestaurantId}/webhook`;

      const sameSecret = decrypt(existing?.stripe?.secret ?? "") === data.secret;

      if (currentStripe?.webhook_id && sameSecret) {
        try {
          await stripeClient.webhookEndpoints.del(currentStripe.webhook_id);
        } catch {}
      }

      // create webhook
      const webhook = await stripeClient.webhookEndpoints.create({
        url: webhookUrl,
        enabled_events: [...STRIPE_WEBHOOK_EVENTS],
        description: `Restaurant ${session.user.activeRestaurantId} Webhook`,
      });

      if (!webhook?.secret) {
        return { success: false, error: "Webhook creation failed." };
      }

      encryptedSecret = encrypt(data.secret!);
      encryptedWebhookSecret = encrypt(webhook.secret);
      webhookId = webhook.id;
      secretConfigured = true;
      webhookConfigured = true;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Stripe setup failed",
      };
    }
  } else if (currentStripe?.webhook_id && currentStripe.secret) {
    try {
      const stripeClient = await getValidStripeClient(decrypt(currentStripe.secret));
      if (stripeClient) {
        await stripeClient.webhookEndpoints.update(currentStripe.webhook_id, {
          enabled_events: [...STRIPE_WEBHOOK_EVENTS],
        });
      }
    } catch (error) {
      console.error("Could not refresh Stripe webhook events:", error);
    }
  }

  if (!encryptedSecret || !encryptedWebhookSecret || !webhookId) {
    return {
      success: false,
      error: "Internal server error",
    };
  }

  const [updatedRestaurant] = await db
    .update(restaurant)
    .set({
      stripe: {
        publishable: data.publishable,
        secret: encryptedSecret,
        webhook_secret: encryptedWebhookSecret,
        currency: data.currency,
        configured: secretConfigured && webhookConfigured,
        secret_configured: secretConfigured,
        webhook_configured: webhookConfigured,
        webhook_id: webhookId,
      },
      updatedAt: new Date(),
    })
    .where(eq(restaurant.id, session.user.activeRestaurantId))
    .returning({ stripe: restaurant.stripe });

  logMerchantActivity(session.user, {
    type: updatedRestaurant.stripe?.configured
      ? "integration.stripe_connected"
      : "integration.stripe_disconnected",
    data: {},
  });

  return { success: true, data: { stripe: toPublicStripeConfig(updatedRestaurant.stripe) } };
}
