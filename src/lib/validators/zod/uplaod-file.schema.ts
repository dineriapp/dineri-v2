import { z } from "zod";

export const uploadedFileSchema = z.object({
    url: z.string().url(),
    key: z.string(),
    order: z.number().optional(),
    type: z.enum(["video", "image"]).optional(),
});