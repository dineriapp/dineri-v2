import { z } from "zod";

export const reservationTableSchema = z.object({
    areaId: z.string().min(1, "Area is required"),
    label: z.string().min(1).max(50),
    seats: z.number().int().min(1).max(50),
    active: z.boolean(),
});

export type ReservationTableSchemaType = z.infer<typeof reservationTableSchema>;
