import { z } from "zod";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format");

const singleDaySchema = z
  .object({
    isOpen: z.boolean(),

    openTime: z.string().nullable(),

    closeTime: z.string().nullable(),
  })
  .superRefine((data, ctx) => {
    // closed day
    if (!data.isOpen) {
      if (data.openTime !== null || data.closeTime !== null) {
        ctx.addIssue({
          code: "custom",
          message: "Closed days must have null times",
        });
      }

      return;
    }

    // open day validations
    if (!data.openTime) {
      ctx.addIssue({
        code: "custom",
        path: ["openTime"],
        message: "Opening time is required",
      });
    }

    if (!data.closeTime) {
      ctx.addIssue({
        code: "custom",
        path: ["closeTime"],
        message: "Closing time is required",
      });
    }

    if (data.openTime && !timeSchema.safeParse(data.openTime).success) {
      ctx.addIssue({
        code: "custom",
        path: ["openTime"],
        message: "Invalid opening time",
      });
    }

    if (data.closeTime && !timeSchema.safeParse(data.closeTime).success) {
      ctx.addIssue({
        code: "custom",
        path: ["closeTime"],
        message: "Invalid closing time",
      });
    }
  });

export const RestaurantTimeZoneSchema = z.object({
  opening_hours: z.object({
    "0": singleDaySchema,
    "1": singleDaySchema,
    "2": singleDaySchema,
    "3": singleDaySchema,
    "4": singleDaySchema,
    "5": singleDaySchema,
    "6": singleDaySchema,
  }),
  timezone: z.string().trim().min(1, "Timezone is required"),
});

export type RestaurantTimeZoneSchemaValues = z.infer<typeof RestaurantTimeZoneSchema>;
