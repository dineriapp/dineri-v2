import { renderEmail, textToHtml } from "@/lib/email/layout";

export function buildEmail(body: string, subject: string): string {
  return renderEmail({
    preheader: subject,
    heading: subject,
    bodyHtml: textToHtml(body),
    footerNote:
      "This is an automated message about your interaction with the venue above. Please do not reply to this address unless invited to.",
  });
}
