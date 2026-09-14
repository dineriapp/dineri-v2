import { z } from "zod";

const websiteSchema = z
  .string()
  .trim()
  .refine((value) => {
    try {
      const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;

      const url = new URL(normalized);

      // allow only http/https
      if (!["http:", "https:"].includes(url.protocol)) {
        return false;
      }

      // valid domain
      return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(url.hostname);
    } catch {
      return false;
    }
  }, "Please enter a valid website URL")
  .optional()
  .or(z.literal(""));

export const ContactInformationSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  website: websiteSchema,
});

export type ContactInformationSchemaValues = z.infer<typeof ContactInformationSchema>;
