import { z } from "zod";
import { uploadedFileSchema } from "./uplaod-file.schema";
import { sortOrderSchema } from "./sort-order.schema";
import { TAG_KEYS } from "@/utils/tags";

// Menu Category Schema
export const menuCategorySchema = z.object({
  name: z.string().min(1).max(255),
  show_on_public_page: z.boolean(),
  sort_order: sortOrderSchema,
});

const addonSchema = z.object({
  label: z.string().min(1),
  price: z.number().nonnegative(),
});

// Menu Item Schema
export const menuItemSchema = z.object({
  categoryId: z.string().min(1),
  image: z.array(uploadedFileSchema).max(1, "only one image is allowed"),
  name: z.string().min(1).max(255),
  emoji: z.string().optional(),
  price: z.number().positive().min(1),
  description: z.string().nullable(),
  customization_detail: z.string().nullable().optional(),
  sort_order: sortOrderSchema,
  addons: z.array(addonSchema),
  tags: z.array(z.enum(TAG_KEYS)),
  show_on_public_page: z.boolean(),
});

// Type exports
export type MenuCategorySchemaType = z.infer<typeof menuCategorySchema>;
export type MenuItemSchemaType = z.infer<typeof menuItemSchema>;
