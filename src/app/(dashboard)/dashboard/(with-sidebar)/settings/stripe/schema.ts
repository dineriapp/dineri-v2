import { STRIPE_CURRENCIES } from "@/lib/stripe/types";
import { z } from "zod";

export const StripeConfigSchema = z
  .object({
    publishable: z
      .string()
      .trim()
      .min(1, "Publishable key is required")
      .startsWith("pk_", "Invalid Stripe publishable key"),

    secret: z
      .string()
      .trim()
      .startsWith("sk_", "Invalid Stripe secret key")
      .optional()
      .or(z.literal("")),

    currency: z.enum(STRIPE_CURRENCIES, "Please select a valid currency"),
  })
  .superRefine((data, ctx) => {
    // skip if secret empty (your replace flow allows this)
    if (!data.secret) return;

    const pubIsLive = data.publishable.startsWith("pk_live_");
    const secIsLive = data.secret.startsWith("sk_live_");

    const pubIsTest = data.publishable.startsWith("pk_test_");
    const secIsTest = data.secret.startsWith("sk_test_");

    if ((pubIsLive && !secIsLive) || (pubIsTest && !secIsTest)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["secret"],
        message: "Publishable and secret keys must both be live or both be test keys",
      });
    }
  });

export type StripeConfigSchemaValues = z.infer<typeof StripeConfigSchema>;

export const STRIPE_WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "checkout.session.expired",
  "checkout.session.async_payment_failed",
  "charge.refunded",
  "charge.refund.updated",
  "charge.dispute.created",
] as const;
