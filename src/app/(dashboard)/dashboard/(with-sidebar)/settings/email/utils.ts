import { EmailTemplates, TemplateDataMap } from "./types";

export const validateTemplates = (input: EmailTemplates): { valid: boolean; error?: string } => {
  const requiredKeys: (keyof EmailTemplates)[] = [
    "reservation_confirmation",
    "order_booking",
    "delivery_update",
    "booking_cancellation",
  ];
  for (const key of requiredKeys) {
    const tpl = input[key];
    if (!tpl) {
      return { valid: false, error: `Missing template: ${key}` };
    }
    if (!tpl.subject || tpl.subject.trim() === "") {
      return { valid: false, error: `Subject is missing for ${key}` };
    }
    if (!tpl.body || tpl.body.trim() === "") {
      return { valid: false, error: `Body is missing for ${key}` };
    }
  }
  return { valid: true };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function replacePlaceholders(text: string, data: Record<string, any>): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const value = data[key];
    return value !== undefined && value !== null ? String(value) : `{{${key}}}`;
  });
}

export function renderTemplate<K extends keyof TemplateDataMap>(
  template: { subject: string; body: string },
  data: TemplateDataMap[K],
): { subject: string; body: string } {
  return {
    subject: replacePlaceholders(template.subject, data),
    body: replacePlaceholders(template.body, data),
  };
}
