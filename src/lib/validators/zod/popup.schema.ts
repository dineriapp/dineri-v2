import { z } from "zod";
import { popupOnPageEnum, popupStatusEnum } from "@/drizzle/schema";

export const popupSchema = z.object({
    badge: z
        .string()
        .min(1, "Badge text is required")
        .max(40, "Badge must be 40 characters or fewer"),
    title: z
        .string()
        .min(1, "Title is required")
        .max(255, "Title must be 255 characters or fewer"),
    body: z
        .string()
        .min(1, "Body is required")
        .max(1000, "Body must be 1000 characters or fewer"),
    cta: z
        .string()
        .min(1, "CTA label is required")
        .max(100, "CTA label must be 100 characters or fewer"),
    ctaUrl: z.url("Enter a full URL, e.g. https://example.com"),
    footerNote: z
        .string()
        .max(160, "Footer note must be 160 characters or fewer")
        .optional()
        .or(z.literal("")),
    onPage: z.enum(popupOnPageEnum, "Select which page this popup should show on"),
    trigger_after_seconds: z.union(
        [z.literal(0), z.literal(10), z.literal(30), z.literal(60)],
        "Select when this popup should display",
    ),
    status: z.enum(popupStatusEnum, "Select whether this popup is on or off"),
});

export type PopupSchemaType = z.infer<typeof popupSchema>;
