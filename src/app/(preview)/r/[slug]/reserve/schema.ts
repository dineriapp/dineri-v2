import { z } from "zod";

export const reservationRequestSchema = z.object({
    name: z.string().trim().min(2, "Name is required").max(80),
    partySize: z.number().int().min(1).max(20),
    phone: z
        .string()
        .trim()
        .min(6, "Phone is required")
        .max(30)
        .regex(/^\+?\d+$/, "Phone number must contain only digits and an optional '+' at the beginning"),
    email: z.string().trim().email("Invalid email").max(255),
    date: z.string().min(1, "Pick a date"),
    time: z.string().min(1, "Pick a time"),
    notes: z.string().max(300).optional(),
    areaId: z.string().optional(),
    isPriority: z.boolean().optional(),
});

export type ReservationRequestSchemaType = z.infer<typeof reservationRequestSchema>;
