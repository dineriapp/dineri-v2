import { SmtpConfig } from "@/lib/email/types";
import { StripeConfig } from "@/lib/stripe/types";

const REDACTED = "";

export function toPublicStripeConfig(stripe: StripeConfig | null | undefined): StripeConfig | null {
    if (!stripe) return null;
    return {
        ...stripe,
        secret: REDACTED,
        webhook_secret: REDACTED,
    };
}

export function toPublicSmtpConfig(config: SmtpConfig | null | undefined): SmtpConfig | null {
    if (!config) return null;
    return {
        ...config,
        smtpPassword: REDACTED,
    };
}
