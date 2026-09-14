import { z } from "zod";

export const qrCodeSchema = z.object({
    label: z
        .string()
        .trim()
        .min(1, "Label is required.")
        .max(255, "Label cannot exceed 255 characters."),

    targetUrl: z
        .string()
        .trim()
        .min(1, "Target URL is required.")
        .url("Please enter a valid URL."),

    foregroundColor: z
        .string()
        .regex(
            /^#[0-9a-fA-F]{6}$/,
            "Foreground color must be a valid hex color (e.g. #0F1115)."
        ),

    backgroundColor: z
        .string()
        .regex(
            /^#[0-9a-fA-F]{6}$/,
            "Background color must be a valid hex color (e.g. #FFFFFF)."
        ),

    shape: z.enum(["square", "dots"], {
        error: "Please select a valid QR code shape.",
    }),
});

export type QRCodeSchemaType = z.infer<typeof qrCodeSchema>;