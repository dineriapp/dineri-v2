import { z } from "zod";
import { sortOrderSchema } from "./sort-order.schema";
import { uploadedFileSchema } from "./uplaod-file.schema";

export const successStorySchema = z.object({
    title: z.string().min(1, "Title is required").max(200),
    body: z.string().min(1, "Story text is required").max(5000),
    image: z
        .array(uploadedFileSchema)
        .min(1, "image is required")
        .max(1, "only one image is allowed"),
    active: z.boolean(),
    sort_order: sortOrderSchema,
});

export type SuccessStorySchemaType = z.infer<typeof successStorySchema>;
