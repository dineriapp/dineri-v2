import { uploadedFileSchema } from "@/lib/validators/zod/uplaod-file.schema";
import { z } from "zod";

export const BusinessInformationSchema = z.object({
  name: z.string().min(1, "Venue name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^(?!-)[a-z0-9-]+(?<!-)$/, "Only lowercase letters, numbers, and hyphens are allowed"),
  bio: z.string().optional(),
  tagline: z.string().optional(),
  logo: z.array(uploadedFileSchema).min(1, "Logo is required").max(1, "Only one image is allowed"),
});

export type BusinessInformationSchemaValues = z.infer<typeof BusinessInformationSchema>;
