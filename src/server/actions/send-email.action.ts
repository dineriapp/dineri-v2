import "server-only";

import { publishEmailToQueue } from "@/lib/email-publisher";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmailAction(params: SendEmailParams) {
  const { to, subject, html } = params;

  const result = await publishEmailToQueue({
    type: "platform",
    to,
    subject,
    html,
  });

  if (!result.success) {
    console.error("Email error:", result.error);
    return { success: false, error: result.error };
  }

  return { success: true };
}
