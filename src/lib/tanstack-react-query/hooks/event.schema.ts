import {
  DEFAULT_EVENT_TIMEZONE,
  EventSchedule,
  getEventLeadTimeError,
} from "@/lib/services/event-visibility";
import { sortOrderSchema } from "@/lib/validators/zod/sort-order.schema";
import { z } from "zod";

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD");

// Time validation helper: HH:MM
const timeStringSchema = z
  .string()
  .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format. Use HH:MM");

export const eventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  date: dateStringSchema,
  time: timeStringSchema,
  location: z.string().min(1, "Location is required").max(100),
  description: z.string().min(1, "Description is required").max(2000),
  buttonText: z.string().trim().max(60).nullable().optional(),
  buttonLink: z
    .string()
    .trim()
    .max(2000)
    .refine(
      (v) => !v || /^https?:\/\/.+/i.test(v),
      "Enter a full URL starting with http:// or https://",
    )
    .nullable()
    .optional(),
  active: z.boolean(),
  sort_order: sortOrderSchema,
});

function requireBothButtonFields(
  value: { buttonText?: string | null; buttonLink?: string | null },
  ctx: z.RefinementCtx,
) {
  const text = value.buttonText?.trim() ?? "";
  const link = value.buttonLink?.trim() ?? "";

  if (text && !link) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["buttonLink"],
      message: "Add the link this button should open",
    });
  }
  if (link && !text) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["buttonText"],
      message: "Add the text to show on this button",
    });
  }
}

// Type
export type EventSchemaType = z.infer<typeof eventSchema>;

type LeadTimeOptions = {
  timezone?: string | null;
  existing?: EventSchedule | null;
};

export function makeEventSchema({ timezone, existing }: LeadTimeOptions = {}) {
  const zone = timezone || DEFAULT_EVENT_TIMEZONE;

  return eventSchema.superRefine((value, ctx) => {
    requireBothButtonFields(value, ctx);

    if (existing && existing.date === value.date && existing.time === value.time) return;

    const error = getEventLeadTimeError({ date: value.date, time: value.time }, zone);
    if (!error) return;

    for (const path of ["date", "time"] as const) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message: error });
    }
  });
}
