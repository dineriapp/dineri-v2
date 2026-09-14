"use client";
import { FormEvent, ReactNode, useRef, useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PillButton } from "@/components/ui/ui-kit/PillButton";
import { cn } from "@/lib/utils";
import { submitJobApplication } from "@/server/actions/submit-forms.action";
import { Paperclip, Send } from "lucide-react";
import { toast } from "sonner";

const fieldLabel =
  "font-jetbrains-mono uppercase tracking-[0.12rem] text-[11px] uppercase tracking-[0.18em] text-muted-foreground";
const fieldBase =
  "mt-2 w-full rounded-3xl border border-foreground/10 bg-surface-1 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/30";
const selectTriggerCls =
  "mt-2 h-10! w-full rounded-3xl! border border-foreground/10 bg-surface-1 px-3.5 py-2.5 text-sm text-foreground transition-colors hover:border-foreground/20 focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 data-[placeholder]:text-muted-foreground/60";

const RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const RESUME_MAX_SIZE_MB = 5;

const experienceOpts = ["0-1 years", "2-3 years", "4-5 years", "6-10 years", "10+ years"];
const educationOpts = [
  "High School",
  "Associate Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD",
];
const noticeOpts = ["Immediately", "1 week", "2 weeks", "1 month", "2 months", "3 months"];
const genderOpts = ["Prefer not to say", "Male", "Female", "Non-binary", "Other"];

const schema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z
    .string()
    .trim()
    .min(6, "Phone number is required")
    .max(20)
    .regex(/^[0-9]+$/, "Digits only, please"),
  experience: z.string().min(1, "Select years of experience"),
  education: z.string().min(1, "Select education level"),
  notice: z.string().min(1, "Select notice period"),
  gender: z.string().min(1, "Select an option"),
  address: z.string().trim().min(1, "Address is required").max(200),
  city: z
    .string()
    .trim()
    .min(1, "City is required")
    .max(100)
    .regex(/^[\p{L}\s'.-]+$/u, "Please use letters only"),
  state: z.string().trim().min(1, "State is required").max(100),
  zip: z.string().trim().min(1, "ZIP is required").max(20),
  portfolio: z.string().trim().url("Invalid URL").max(255).optional().or(z.literal("")),
  linkedin: z.string().trim().url("Invalid URL").max(255).optional().or(z.literal("")),
  github: z.string().trim().url("Invalid URL").max(255).optional().or(z.literal("")),
  salary: z
    .string()
    .trim()
    .min(1, "Salary expectations required")
    .max(20)
    .regex(/^[0-9]+$/, "Digits only, please"),
  cover: z.string().trim().min(20, "Cover letter must be at least 20 characters").max(5000),
});

interface Props {
  role: string;
  team: string;
  trigger: ReactNode;
}

type TextField =
  | "fullName"
  | "email"
  | "phone"
  | "address"
  | "city"
  | "state"
  | "zip"
  | "portfolio"
  | "linkedin"
  | "github"
  | "salary"
  | "cover";

const initialValues: Record<TextField, string> = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  portfolio: "",
  linkedin: "",
  github: "",
  salary: "",
  cover: "",
};

// Order in which to focus first invalid field. Mirrors visual order in the form.
const fieldOrder = [
  "fullName",
  "email",
  "phone",
  "experience",
  "education",
  "notice",
  "gender",
  "address",
  "city",
  "state",
  "zip",
  "salary",
  "portfolio",
  "linkedin",
  "github",
  "resume",
  "cover",
] as const;

const selectIdMap: Record<string, string> = {
  experience: "exp-trigger",
  education: "edu-trigger",
  notice: "notice-trigger",
  gender: "gender-trigger",
};

export const JobApplicationDialog = ({ role, team, trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [values, setValues] = useState<Record<TextField, string>>(initialValues);

  // controlled select values
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState("");
  const [notice, setNotice] = useState("");
  const [gender, setGender] = useState("");

  const formRef = useRef<HTMLFormElement>(null);
  const resumeRef = useRef<HTMLInputElement>(null);

  const fieldFilters: Partial<Record<TextField, (v: string) => string>> = {
    phone: (v) => v.replace(/[^0-9]/g, ""),
    salary: (v) => v.replace(/[^0-9]/g, ""),
    city: (v) => v.replace(/[^\p{L}\s'.-]/gu, ""),
  };

  const onChange =
    (k: TextField) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const filter = fieldFilters[k];
      const value = filter ? filter(e.target.value) : e.target.value;
      setValues((p) => ({ ...p, [k]: value }));
    };

  const fullData = {
    ...values,
    experience,
    education,
    notice,
    gender,
  };

  const focusFirstError = (errs: Record<string, string>) => {
    const first = fieldOrder.find((k) => errs[k]);
    if (!first) return;
    requestAnimationFrame(() => {
      if (first === "resume") {
        resumeRef.current?.focus();
        return;
      }
      const root = formRef.current;
      if (!root) return;
      const selector = selectIdMap[first] ? `#${selectIdMap[first]}` : `[name="${first}"]`;
      const el = root.querySelector<HTMLElement>(selector);
      el?.focus();
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = schema.safeParse(fullData);
    const errs: Record<string, string> = {};
    if (!result.success) {
      result.error.issues.forEach((i) => {
        const k = i.path[0] as string;
        if (!errs[k]) errs[k] = i.message;
      });
    }
    const resumeFile = resumeRef.current?.files?.[0] ?? null;
    if (!resumeFile) {
      errs.resume = "Resume/CV is required";
    } else if (!RESUME_TYPES.includes(resumeFile.type)) {
      errs.resume = "Resume must be a PDF, DOC, or DOCX file.";
    } else if (resumeFile.size > RESUME_MAX_SIZE_MB * 1024 * 1024) {
      errs.resume = `Resume must be under ${RESUME_MAX_SIZE_MB}MB.`;
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      focusFirstError(errs);
      toast.error("Please review the form", {
        description: "Some fields need your attention.",
      });
      return;
    }

    if (!result.success || !resumeFile) return; // already handled above; narrows result.data for TS
    setErrors({});
    setSubmitting(true);
    const formData = new FormData();
    formData.set("role", role);
    Object.entries(result.data).forEach(([key, value]) => {
      formData.set(key, value ?? "");
    });
    formData.set("resume", resumeFile);
    const res = await submitJobApplication(formData);
    setSubmitting(false);
    if (!res.success) {
      toast.error("Something went wrong", { description: res.error });
      return;
    }
    setOpen(false);
    toast.success("Application submitted", {
      description: `Thanks! We received your application for ${role} - check your inbox for a confirmation.`,
    });
  };

  const err = (k: string) =>
    errors[k] ? (
      <p id={`err-${k}`} className="mt-1 text-xs text-red-400">
        {errors[k]}
      </p>
    ) : null;

  const fieldProps = (k: TextField) => ({
    name: k,
    value: values[k],
    onChange: onChange(k),
    "aria-invalid": !!errors[k],
    "aria-describedby": errors[k] ? `err-${k}` : undefined,
    className: fieldBase,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] gap-4! sm:max-w-3xl! w-full overflow-y-auto border-foreground/10 bg-background p-0">
        <div className="border-b border-foreground/5 p-6 sm:p-8">
          <DialogHeader className="space-y-1 text-left">
            <div className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[11px] text-lime">
              {team} · Application
            </div>
            <DialogTitle className="font-inter-tight text-2xl font-semibold tracking-tight sm:text-3xl">
              Apply for {role}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              Tell us about yourself. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 p-6 sm:p-8" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={fieldLabel}>Full Name *</label>
              <input {...fieldProps("fullName")} placeholder="Jane Doe" />
              {err("fullName")}
            </div>
            <div>
              <label className={fieldLabel}>Email Address *</label>
              <input {...fieldProps("email")} type="email" placeholder="you@email.com" />
              {err("email")}
            </div>
            <div>
              <label className={fieldLabel}>Phone Number *</label>
              <input
                {...fieldProps("phone")}
                type="tel"
                inputMode="numeric"
                placeholder="390212345678"
              />
              {err("phone")}
            </div>
            <div>
              <label className={fieldLabel} htmlFor="exp-trigger">
                Years of Experience *
              </label>
              <Select value={experience} onValueChange={setExperience}>
                <SelectTrigger
                  id="exp-trigger"
                  aria-invalid={!!errors.experience}
                  className={selectTriggerCls}
                >
                  <SelectValue placeholder="Select experience" />
                </SelectTrigger>
                <SelectContent className="border-foreground/10 bg-background">
                  {experienceOpts.map((o) => (
                    <SelectItem key={o} value={o} className="text-sm focus:bg-lime/10">
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {err("experience")}
            </div>
            <div>
              <label className={fieldLabel} htmlFor="edu-trigger">
                Education Level *
              </label>
              <Select value={education} onValueChange={setEducation}>
                <SelectTrigger
                  id="edu-trigger"
                  aria-invalid={!!errors.education}
                  className={selectTriggerCls}
                >
                  <SelectValue placeholder="Select education" className="" />
                </SelectTrigger>
                <SelectContent className="border-foreground/10 bg-background">
                  {educationOpts.map((o) => (
                    <SelectItem key={o} value={o} className="text-sm focus:bg-lime/10">
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {err("education")}
            </div>
            <div>
              <label className={fieldLabel} htmlFor="notice-trigger">
                Notice Period *
              </label>
              <Select value={notice} onValueChange={setNotice}>
                <SelectTrigger
                  id="notice-trigger"
                  aria-invalid={!!errors.notice}
                  className={selectTriggerCls}
                >
                  <SelectValue placeholder="Select notice period" />
                </SelectTrigger>
                <SelectContent className="border-foreground/10 bg-background">
                  {noticeOpts.map((o) => (
                    <SelectItem key={o} value={o} className="text-sm focus:bg-lime/10">
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {err("notice")}
            </div>
            <div className="sm:col-span-2">
              <label className={fieldLabel} htmlFor="gender-trigger">
                Gender *
              </label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger
                  id="gender-trigger"
                  aria-invalid={!!errors.gender}
                  className={selectTriggerCls}
                >
                  <SelectValue placeholder="Prefer not to say" />
                </SelectTrigger>
                <SelectContent className="border-foreground/10 bg-background">
                  {genderOpts.map((o) => (
                    <SelectItem key={o} value={o} className="text-sm focus:bg-lime/10">
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {err("gender")}
            </div>
            <div className="sm:col-span-2">
              <label className={fieldLabel}>Address *</label>
              <input {...fieldProps("address")} placeholder="Via Brera 12" />
              {err("address")}
            </div>
            <div>
              <label className={fieldLabel}>City *</label>
              <input {...fieldProps("city")} placeholder="Milan" />
              {err("city")}
            </div>
            <div>
              <label className={fieldLabel}>State *</label>
              <input {...fieldProps("state")} placeholder="MI" />
              {err("state")}
            </div>
            <div>
              <label className={fieldLabel}>ZIP Code *</label>
              <input {...fieldProps("zip")} placeholder="20121" />
              {err("zip")}
            </div>
            <div>
              <label className={fieldLabel}>Salary Expectations *</label>
              <input {...fieldProps("salary")} inputMode="numeric" placeholder="45000" />
              {err("salary")}
            </div>
            <div>
              <label className={fieldLabel}>Portfolio URL (Optional)</label>
              <input {...fieldProps("portfolio")} placeholder="https://…" />
              {err("portfolio")}
            </div>
            <div>
              <label className={fieldLabel}>LinkedIn Profile (Optional)</label>
              <input {...fieldProps("linkedin")} placeholder="https://linkedin.com/in/…" />
              {err("linkedin")}
            </div>
            <div className="sm:col-span-2">
              <label className={fieldLabel}>GitHub Profile (Optional)</label>
              <input {...fieldProps("github")} placeholder="https://github.com/…" />
              {err("github")}
            </div>
          </div>

          <div>
            <label className={fieldLabel}>Resume/CV *</label>
            <label
              htmlFor="resume"
              className="mt-2 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-foreground/15 bg-surface-1 px-4 py-4 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              <Paperclip className="h-4 w-4 text-lime" />
              <span className="flex-1 truncate">
                {resumeName ?? "Upload your Resume/CV (PDF, DOC, DOCX)"}
              </span>
              <input
                ref={resumeRef}
                id="resume"
                name="resume"
                type="file"
                accept=".pdf,.doc,.docx"
                aria-invalid={!!errors.resume}
                aria-describedby={errors.resume ? "err-resume" : undefined}
                className="sr-only"
                onChange={(e) => setResumeName(e.target.files?.[0]?.name ?? null)}
              />
            </label>
            {err("resume")}
          </div>

          <div>
            <label className={fieldLabel}>Cover Letter *</label>
            <textarea
              name="cover"
              value={values.cover}
              onChange={onChange("cover")}
              rows={5}
              placeholder="Tell us why you're the right fit…"
              aria-invalid={!!errors.cover}
              aria-describedby={errors.cover ? "err-cover" : undefined}
              className={cn(fieldBase, "resize-none")}
            />
            {err("cover")}
          </div>

          <div className="flex justify-end pt-2">
            <PillButton type="submit" size="md" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Application"}
              {!submitting && <Send className="h-3.5 w-3.5" />}
            </PillButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
