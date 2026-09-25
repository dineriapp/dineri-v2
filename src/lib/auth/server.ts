import { db } from "@/drizzle/db";
import { restaurant, subscription, userRoleEnum } from "@/drizzle/schema";
import { UserRoleType } from "@/drizzle/types";
import { resetPasswordTemplate, verifyEmailTemplate } from "@/lib/email/templates";
import { sendEmailAction } from "@/server/actions/send-email.action";
import { stripe } from "@better-auth/stripe";
import { APIError, betterAuth, BetterAuthOptions, User } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, captcha, customSession } from "better-auth/plugins";
import { and, eq, or } from "drizzle-orm";
import { authRateLimitStorage } from "../rate-limit/auth-storage";
import { CLIENT_IP_HEADER } from "../rate-limit/ip";
import { stripeClient } from "../stripe";
import { PlanName, STRIPE_PLANS } from "../stripe/plans";
import { captchaOptions } from "./captcha";
import { allowAuthEmail } from "./email-throttle";

const ALLOWED_ROLES = userRoleEnum.enumValues;

const options = {
  appName: "Dineri",
  advanced: {
    cookiePrefix: process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME ?? "dineri",
    ipAddress: {
      ipAddressHeaders: [CLIENT_IP_HEADER],
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customStorage: authRateLimitStorage,
    customRules: {
      // Email/password sign in
      "/sign-in/email": {
        window: 60,
        max: 5,
      },
      // Social sign-in / OAuth initiation
      "/sign-in/social": {
        window: 60,
        max: 10,
      },
      // Account registration
      "/sign-up/email": {
        window: 300,
        max: 5,
      },
      // Request password reset email
      "/request-password-reset": {
        window: 300,
        max: 3,
      },
      // Actually reset password
      "/reset-password": {
        window: 300,
        max: 5,
      },
      // Send/resend verification email
      "/send-verification-email": {
        window: 300,
        max: 5,
      },
      // Verify email
      "/verify-email": {
        window: 300,
        max: 10,
      },
      // Sign out
      "/sign-out": {
        window: 60,
        max: 20,
      },
      // Get current session
      "/get-session": {
        window: 60,
        max: 100,
      },
      // Update user information
      "/update-user": {
        window: 60,
        max: 20,
      },
      // Delete account
      "/delete-user": {
        window: 300,
        max: 5,
      },
      // Change password
      "/change-password": {
        window: 300,
        max: 5,
      },
      // Change email
      "/change-email": {
        window: 300,
        max: 5,
      },
      // List sessions
      "/list-sessions": {
        window: 60,
        max: 30,
      },
      // Revoke session
      "/revoke-session": {
        window: 60,
        max: 20,
      },
      // Revoke all sessions
      "/revoke-sessions": {
        window: 300,
        max: 5,
      },
    },
  },
  user: {
    additionalFields: {
      role: { required: true, type: ALLOWED_ROLES, input: false },
      activeRestaurantId: { required: false, type: "string", input: false },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    onExistingUserSignUp: async () => {},
    sendResetPassword: async ({ user, url }) => {
      if (!(await allowAuthEmail("reset", user.email))) {
        console.warn("[auth] Password reset email suppressed: per-recipient limit reached");
        return;
      }
      await sendEmailAction({
        to: user.email,
        subject: "Reset your Dineri password",
        html: resetPasswordTemplate(url),
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }: { user: User; url: string }) => {
      if (!(await allowAuthEmail("verify", user.email))) {
        console.warn("[auth] Verification email suppressed: per-recipient limit reached");
        return;
      }
      await sendEmailAction({
        to: user.email,
        subject: "Confirm your email - welcome to Dineri",
        html: verifyEmailTemplate(url),
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  trustedOrigins: [String(process.env.BETTER_AUTH_URL)],
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(",") ?? [];

          let role = (user.role ?? "user") as UserRoleType;

          if (!ALLOWED_ROLES.includes(role)) {
            throw new APIError("BAD_REQUEST", {
              message: "Invalid role provided",
              code: "INVALID_ROLE",
            });
          }

          if (role === "admin" && !ADMIN_EMAILS.includes(user.email)) {
            throw new APIError("FORBIDDEN", {
              message: "You are not allowed to register as admin",
              code: "UNAUTHORIZED_ROLE",
            });
          }

          if (ADMIN_EMAILS.includes(user.email)) {
            role = "admin";
          }

          return { data: { ...user, role } };
        },
      },
    },
  },
  plugins: [captcha(captchaOptions())],
} satisfies BetterAuthOptions;

export const auth = betterAuth({
  ...options,
  plugins: [
    ...(options.plugins ?? []),
    admin(),
    customSession(async ({ user, session }, ctx) => {
      const skipEnrichment = ctx.headers?.get("x-skip-enrichment") === "true";

      if (skipEnrichment) {
        const claimedRestaurantId = user.activeRestaurantId as string | null;
        let verifiedRestaurantId: string | null = null;

        if (claimedRestaurantId) {
          const owns = await db.query.restaurant.findFirst({
            where: and(eq(restaurant.id, claimedRestaurantId), eq(restaurant.ownerId, user.id)),
            columns: { id: true },
          });
          if (!owns) {
            throw new APIError("FORBIDDEN", {
              message: "Restaurant access denied",
              code: "RESTAURANT_ACCESS_DENIED",
            });
          }
          verifiedRestaurantId = owns.id;
        }

        return {
          user: {
            ...user,
            activeRestaurantId: verifiedRestaurantId ?? "",
            subscription: {
              plan: "starter" as PlanName,
              active: false,
              status: null,
            },
          },
          session: session,
        };
      }

      const claimedRestaurantId = user.activeRestaurantId as string | null;

      const [ownedMatch, activeSubscription] = await Promise.all([
        claimedRestaurantId
          ? db.query.restaurant.findFirst({
              where: and(eq(restaurant.id, claimedRestaurantId), eq(restaurant.ownerId, user.id)),
              columns: { id: true },
            })
          : null,

        db.query.subscription.findFirst({
          where: and(
            eq(subscription.referenceId, user.id),
            or(eq(subscription.status, "active"), eq(subscription.status, "trialing")),
          ),
          columns: {
            status: true,
            plan: true,
          },
        }),
      ]);

      let resolvedRestaurantId = ownedMatch?.id ?? null;
      if (!resolvedRestaurantId) {
        const firstOwned = await db.query.restaurant.findFirst({
          where: eq(restaurant.ownerId, user.id),
          columns: { id: true },
        });
        resolvedRestaurantId = firstOwned?.id ?? null;
      }

      return {
        user: {
          ...user,
          activeRestaurantId: resolvedRestaurantId ?? "",
          subscription: {
            plan: (activeSubscription?.plan ?? "starter") as PlanName,
            active: !!activeSubscription,
            status: activeSubscription ?? null,
          },
        },
        session: session,
      };
    }, options),
    stripe({
      stripeClient: stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      createCustomerOnSignUp: false,
      subscription: {
        enabled: true,
        plans: STRIPE_PLANS,
      },
    }),
    nextCookies(),
  ],
});
