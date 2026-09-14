import { z } from "zod";
import { sortOrderSchema } from "./sort-order.schema";

export const linkSchema = z.object({
    title: z.string().min(1).max(255),
    url: z.url(),
    icon_key: z.string().min(1).max(100),
    active: z.boolean(),
    sort_order: sortOrderSchema,
});

export type LinkSchemaType = z.infer<typeof linkSchema>;