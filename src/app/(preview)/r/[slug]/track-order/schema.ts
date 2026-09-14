import { z } from "zod";

export const orderTrackingSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .min(1, "Order number is required")
    .transform((value) => value.replace(/[^0-9]/g, ""))
    .refine((digits) => digits.length > 0, "Enter a valid order number")
    .transform((digits) => Number(digits)),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(255),
});

export type OrderTrackingSchemaType = z.infer<typeof orderTrackingSchema>;
