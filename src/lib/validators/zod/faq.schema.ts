import { z } from "zod";
import { sortOrderSchema } from "./sort-order.schema";

export const faqCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(255),
  active: z.boolean(),
  sort_order: sortOrderSchema,
});

export const faqSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  question: z.string().min(1, "Question is required").max(500),
  answer: z.string().min(1, "Answer is required"),
  active: z.boolean(),
  sort_order: sortOrderSchema,
});

// Types
export type FaqCategorySchemaType = z.infer<typeof faqCategorySchema>;
export type FaqSchemaType = z.infer<typeof faqSchema>;
