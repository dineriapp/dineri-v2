import { renderEmail } from "./layout";

const FONT = "'Helvetica Neue',Arial,sans-serif";
const MUTED = "#9a9a9a";

const para = (text: string) =>
  `<p style="margin:0; font-family:${FONT}; font-size:15px; line-height:1.65; color:${MUTED};">${text}</p>`;

const AUTH_FOOTER =
  "You're receiving this because someone signed up for Dineri with this email address. If it wasn't you, you can safely ignore this message.";

export function verifyEmailTemplate(url: string): string {
  return renderEmail({
    preheader: "Confirm your email to activate your Dineri account.",
    eyebrow: "Welcome to Dineri",
    heading: "Confirm your email address",
    bodyHtml: para(
      "Please confirm your email address to activate your Dineri account and get your venue live.",
    ),
    cta: { label: "Verify email address", url },
    afterCta: "This link expires in 24 hours for your security.",
    footerNote: AUTH_FOOTER,
  });
}

export function resetPasswordTemplate(url: string): string {
  return renderEmail({
    preheader: "Reset the password for your Dineri account.",
    eyebrow: "Account security",
    heading: "Reset your password",
    bodyHtml: para(
      "We received a request to reset your Dineri password. Use the button below to choose a new one. If you didn't request this, you can safely ignore this email.",
    ),
    cta: { label: "Reset password", url },
    afterCta: "This link expires in 1 hour for your security.",
    footerNote: AUTH_FOOTER,
  });
}
