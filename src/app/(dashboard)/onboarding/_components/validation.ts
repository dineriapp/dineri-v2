import { Data } from "@/lib/types/onboarding";

export type FieldErrors = Partial<Record<keyof Data, string>>;

export const FIELD_LABEL: Partial<Record<keyof Data, string>> = {
  brandColor: "Brand colour",
  hoursFrom: "Opening time",
  hoursTo: "Closing time",
  menuSize: "Menu size",
  diners: "Who walks through your door",
  channels: "How customers order",
};

export const fieldAnchorId = (field: keyof Data) => `onboarding-field-${field}`;

export function validateStep(step: number, data: Data): FieldErrors {
  const errors: FieldErrors = {};

  switch (step) {
    case 1:
      if (!data.brandColor) errors.brandColor = "Pick a brand colour.";
      break;
    case 2:
      if (!data.hoursFrom) errors.hoursFrom = "Set an opening time.";
      if (!data.hoursTo) errors.hoursTo = "Set a closing time.";
      break;
    case 3:
      if (!data.menuSize) errors.menuSize = "Choose a menu size.";
      break;
    case 4:
      if (data.diners.length === 0) {
        errors.diners = "Pick at least one type of diner.";
      }
      if (data.channels.length === 0) {
        errors.channels = "Pick at least one way customers order.";
      }
      break;
  }

  return errors;
}
