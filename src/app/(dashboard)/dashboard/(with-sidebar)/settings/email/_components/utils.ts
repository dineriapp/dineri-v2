import { getTestDataForTemplate } from "../test-data";
import { EmailTemplates } from "../types";
import { renderTemplate } from "../utils";

export function renderTemplatePreview(
  template: EmailTemplates[keyof EmailTemplates],
  templateKey: keyof EmailTemplates,
  restaurantName: string,
): { subject: string; body: string } {
  const testData = getTestDataForTemplate(templateKey, restaurantName);
  return renderTemplate(template, testData);
}
