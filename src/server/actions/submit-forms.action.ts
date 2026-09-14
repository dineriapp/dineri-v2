"use server";

import { uploadFileToS3 } from "@/lib/aws";
import { publishEmailToQueue } from "@/lib/email-publisher";
import { limitAnonymousAction } from "@/lib/rate-limit/guard";
import {
  DemoRequestData,
  SupportTicketData,
  demoRequestConfirmation,
  internalNotification,
  jobApplicationConfirmation,
  supportTicketConfirmation,
} from "@/lib/email/notification-templates";
import { z } from "zod";

const RESUME_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const RESUME_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const TEAM_INBOX = process.env.NOTIFICATIONS_EMAIL || "contact@dineri.app";

type ActionResult = { success: boolean; error?: string };

const emailField = z.string().trim().email().max(255);


async function overFormLimit(action: string): Promise<ActionResult | null> {
  const limit = await limitAnonymousAction(action, "publicForm");
  if (limit.allowed) return null;

  const minutes = Math.max(1, Math.ceil(limit.retryAfterSeconds / 60));
  return {
    success: false,
    error: `Too many submissions. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
  };
}

async function sendPair(
  submitterEmail: string,
  confirmation: { subject: string; html: string },
  team: { subject: string; html: string },
): Promise<ActionResult> {
  try {
    await Promise.all([
      publishEmailToQueue({
        type: "platform",
        to: submitterEmail,
        subject: confirmation.subject,
        html: confirmation.html,
      }),
      publishEmailToQueue({
        type: "platform",
        to: TEAM_INBOX,
        subject: team.subject,
        html: team.html,
      }),
    ]);
    return { success: true };
  } catch (err) {
    console.error("Form submission email failed:", err);
    return { success: false, error: "We couldn't send your request. Please try again." };
  }
}


const demoSchema = z.object({
  business: z.string().trim().min(1).max(150),
  contact: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[\p{L}\s'.-]+$/u),
  email: emailField,
  phone: z
    .string()
    .trim()
    .min(6)
    .max(20)
    .regex(/^[0-9]+$/),
  address: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  country: z.string().trim().min(1).max(100),
  notes: z.string().trim().max(2000).optional(),
});

export async function submitDemoRequest(input: DemoRequestData): Promise<ActionResult> {
  const limited = await overFormLimit("demo-request");
  if (limited) return limited;

  const parsed = demoSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Please check the form and try again." };
  const d = parsed.data;

  const confirmation = demoRequestConfirmation(d);
  const team = internalNotification(
    "Demo request",
    `${d.business} requested a demo`,
    [
      { label: "Business", value: d.business },
      { label: "Contact", value: d.contact },
      { label: "Email", value: d.email },
      { label: "Phone", value: d.phone ?? "" },
      { label: "Location", value: [d.address, d.city, d.country].filter(Boolean).join(", ") },
    ],
    { label: "Notes", value: d.notes ?? "" },
  );
  return sendPair(d.email, confirmation, team);
}

const supportSchema = z.object({
  fullName: z.string().trim().min(1).max(100),
  email: emailField,
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
});

export async function submitSupportTicket(input: SupportTicketData): Promise<ActionResult> {
  const limited = await overFormLimit("support-ticket");
  if (limited) return limited;

  const parsed = supportSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Please check the form and try again." };
  const d = parsed.data;

  const confirmation = supportTicketConfirmation(d);
  const team = internalNotification(
    "Support ticket",
    d.subject,
    [
      { label: "From", value: d.fullName },
      { label: "Email", value: d.email },
    ],
    { label: "Message", value: d.message },
  );
  return sendPair(d.email, confirmation, team);
}

const careersSchema = z.object({
  role: z.string().trim().min(1).max(150),
  fullName: z.string().trim().min(1).max(100),
  email: emailField,
  phone: z
    .string()
    .trim()
    .min(6)
    .max(20)
    .regex(/^[0-9]+$/),
  experience: z.string().trim().max(100),
  education: z.string().trim().max(100).optional(),
  notice: z.string().trim().max(100).optional(),
  salary: z.string().trim().max(20).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  portfolio: z.string().trim().max(255).optional(),
  linkedin: z.string().trim().max(255).optional(),
  github: z.string().trim().max(255).optional(),
  cover: z.string().trim().max(5000),
});

export async function submitJobApplication(formData: FormData): Promise<ActionResult> {
  const limited = await overFormLimit("job-application");
  if (limited) return limited;

  const raw: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string") raw[k] = v;
  }

  const parsed = careersSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: "Please check the form and try again." };
  const d = parsed.data;

  const resume = formData.get("resume");
  if (!(resume instanceof File) || resume.size === 0) {
    return { success: false, error: "Please attach your resume/CV." };
  }
  if (!RESUME_MIME_TYPES.includes(resume.type)) {
    return { success: false, error: "Resume must be a PDF, DOC, or DOCX file." };
  }
  if (resume.size > RESUME_MAX_SIZE) {
    return { success: false, error: "Resume must be under 5MB." };
  }

  let resumeUrl: string;
  try {
    const uploaded = await uploadFileToS3(resume, "job-applications");
    resumeUrl = uploaded.url;
  } catch (err) {
    console.error("Resume upload failed:", err);
    return { success: false, error: "We couldn't upload your resume. Please try again." };
  }

  const confirmation = jobApplicationConfirmation(d);
  const team = internalNotification(
    "Job application",
    `${d.fullName} applied for ${d.role}`,
    [
      { label: "Role", value: d.role },
      { label: "Name", value: d.fullName },
      { label: "Email", value: d.email },
      { label: "Phone", value: d.phone },
      { label: "Experience", value: d.experience },
      { label: "Notice period", value: d.notice ?? "" },
      { label: "Salary", value: d.salary ?? "" },
      { label: "Location", value: [d.city, d.state].filter(Boolean).join(", ") },
      { label: "Portfolio", value: d.portfolio ?? "" },
      { label: "LinkedIn", value: d.linkedin ?? "" },
      { label: "GitHub", value: d.github ?? "" },
      { label: "Resume", value: resumeUrl },
    ],
    { label: "Cover letter", value: d.cover },
  );
  return sendPair(d.email, confirmation, team);
}
