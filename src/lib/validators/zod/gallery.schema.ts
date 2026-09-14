import { z } from "zod";
import { sortOrderSchema } from "./sort-order.schema";
import { uploadedFileSchema } from "./uplaod-file.schema";

export function getYoutubeId(url: string) {
    const regExp =
        /^.*(youtu.be\/|v\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match?.[2] ?? null;
}

export const gallerySchema = z
    .object({
        type: z.enum(["image", "video"]),
        image: z
            .array(uploadedFileSchema)
            .max(1, "only one image is allowed"),
        youtube_url: z.string().nullable().optional(),
        youtube_poster: z.string().nullable().optional(),
        link_url: z.string().url("Must be a valid URL").optional(),
        title: z.string().min(1, "Title is required"),
        active: z.boolean(),
        sort_order: sortOrderSchema,
    })
    .superRefine((data, ctx) => {
        if (data.type === "image") {
            // Image required
            if (!data.image.length) {
                ctx.addIssue({
                    code: "custom",
                    path: ["image"],
                    message: "Image is required for image type",
                });
            }
        } else if (data.type === "video") {
            // YouTube URL required and valid

            if (!data.youtube_url) {
                ctx.addIssue({
                    code: "custom",
                    path: ["youtube_url"],
                    message: "YouTube URL is required for video type",
                });
            } else if (getYoutubeId(data.youtube_url) === null) {
                ctx.addIssue({
                    code: "custom",
                    path: ["youtube_url"],
                    message: "Invalid YouTube URL",
                });
            }
            // Title required (UI requirement, even if DB allows null)
            if (!data.title) {
                ctx.addIssue({
                    code: "custom",
                    path: ["title"],
                    message: "Title is required for video type",
                });
            }
        }
    });

export type GallerySchemaType = z.infer<typeof gallerySchema>;