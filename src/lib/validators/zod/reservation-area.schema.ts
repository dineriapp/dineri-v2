import { z } from "zod";

export const reservationAreaSchema = z.object({
    name: z.string().min(1).max(80),
    description: z.string().max(400).nullable().optional(),
    color: z.string().min(1).max(30),
});

export type ReservationAreaSchemaType = z.infer<typeof reservationAreaSchema>;
