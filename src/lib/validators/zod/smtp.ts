import { z } from "zod";

export const smtpTestSchema = z.object({
    smtpHost: z.string().min(1, "SMTP host is required"),
    smtpPort: z.number().int().positive("Port must be a positive integer"),
    smtpSecure: z.boolean(),
    smtpUsername: z.string().min(1, "SMTP username is required"),
    smtpPassword: z.string().min(1, "SMTP password is required"),
    fromEmail: z.string().email("Valid from email is required"),
    fromName: z.string().optional().nullable(),
    testEmail: z.string().email("Valid test email is required"),
});

export type SmtpTestInput = z.infer<typeof smtpTestSchema>;