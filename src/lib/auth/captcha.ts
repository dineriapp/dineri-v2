import type { captcha } from "better-auth/plugins";

type CaptchaOptions = Parameters<typeof captcha>[0];

export const CAPTCHA_PROTECTED_ENDPOINTS = [
  "/sign-up/email",
  "/sign-in/email",
  "/request-password-reset",
  "/send-verification-email",
];

export function captchaOptions(secretKey = process.env.RECAPTCHA_SECRET_KEY!): CaptchaOptions {
  return {
    provider: "google-recaptcha",
    secretKey,
    minScore: 0.5,
    endpoints: CAPTCHA_PROTECTED_ENDPOINTS,
  };
}
