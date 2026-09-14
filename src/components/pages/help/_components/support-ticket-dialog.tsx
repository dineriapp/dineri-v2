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
import { submitSupportTicket } from "@/server/actions/submit-forms.action";
import { Paperclip, Send } from "lucide-react";
import { FormEvent, ReactNode, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  subject: z.string().trim().min(3, "Subject must be at least 3 characters").max(150),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000),
});

type Urgency = "low" | "medium" | "high";

const urgencyOptions: { value: Urgency; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const issueTypes = [
  "Technical Issue",
  "Billing Question",
  "Account Problem",
  "Feature Request",
  "Other",
];

const fieldLabel =
  "font-jetbrains-mono uppercase tracking-[0.12rem] text-[11px] text-muted-foreground";
const fieldBase =
  "mt-2 w-full rounded-[26px] border border-foreground/10 bg-surface-1 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/30";

interface Props {
  trigger?: ReactNode;
}

// Order matters: first invalid field in this list will receive focus.
const fieldOrder = ["fullName", "email", "issueType", "subject", "message", "agreed"] as const;

export const SupportTicketDialog = ({ trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [urgency, setUrgency] = useState<Urgency>("medium");
  const [issueType, setIssueType] = useState<string>("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const agreedRef = useRef<HTMLInputElement>(null);

  const focusFirstError = (errs: Record<string, string>) => {
    const first = fieldOrder.find((k) => errs[k]);
    if (!first) return;
    requestAnimationFrame(() => {
      if (first === "agreed") {
        agreedRef.current?.focus();
        return;
      }
      const root = formRef.current;
      if (!root) return;
      const selector = first === "issueType" ? "#issue-type" : `[name="${first}"]`;
      const el = root.querySelector<HTMLElement>(selector);
      el?.focus();
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      fullName: String(fd.get("fullName") ?? ""),
      email: String(fd.get("email") ?? ""),
      subject: String(fd.get("subject") ?? ""),
      message: String(fd.get("message") ?? ""),
    };
    const result = schema.safeParse(data);
    const errs: Record<string, string> = {};
    if (!result.success) {
      result.error.issues.forEach((i) => {
        const k = i.path[0] as string;
        if (!errs[k]) errs[k] = i.message;
      });
    }
    if (!issueType) errs.issueType = "Please choose an issue type";
    if (!agreed) errs.agreed = "You must agree to the Terms of Service";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      focusFirstError(errs);
      toast.error("Please review the form", {
        description: "Some fields need your attention.",
      });
      return;
    }

    setErrors({});
    setSubmitting(true);
    const res = await submitSupportTicket({
      fullName: data.fullName,
      email: data.email,
      subject: issueType ? `[${issueType}] ${data.subject}` : data.subject,
      message: data.message,
    });
    setSubmitting(false);
    if (!res.success) {
      toast.error("Something went wrong", { description: res.error });
      return;
    }
    setOpen(false);
    toast.success("Request submitted", {
      description:
        "Check your inbox for a confirmation - our team will get back to you within 2 hours on business days.",
    });
  };

  const err = (k: string) =>
    errors[k] ? (
      <p id={`err-${k}`} className="mt-1 text-xs text-red-400">
        {errors[k]}
      </p>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <PillButton size="sm">Open a ticket</PillButton>}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] sm:max-w-2xl gap-4 overflow-y-auto border-foreground/10 bg-background p-0">
        <div className="border-b border-foreground/5 p-6 sm:p-8">
          <DialogHeader className="space-y-0 text-left">
            <div className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[11px] text-muted-foreground">
              /11 - Contact · Support
            </div>
            <DialogTitle className="font-inter-tight text-2xl font-semibold tracking-tight sm:text-3xl">
              Contact Support
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              Fill out the form below and our team will get back to you as soon as possible.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="space-y-5 p-6 sm:p-8"
          noValidate
          aria-describedby={Object.keys(errors).length ? "support-form-errors" : undefined}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={fieldLabel} htmlFor="full-name">
                Full Name *
              </label>
              <input
                id="full-name"
                name="fullName"
                placeholder="Jane Doe"
                aria-invalid={!!errors.fullName}
                aria-describedby={errors.fullName ? "err-fullName" : undefined}
                className={fieldBase}
              />
              {err("fullName")}
            </div>
            <div>
              <label className={fieldLabel} htmlFor="email">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@restaurant.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "err-email" : undefined}
                className={fieldBase}
              />
              {err("email")}
            </div>
          </div>

          <div>
            <span className={fieldLabel}>Urgency</span>
            <div className="mt-2 flex gap-2">
              {urgencyOptions.map((u) => {
                const active = urgency === u.value;
                return (
                  <button
                    key={u.value}
                    type="button"
                    onClick={() => setUrgency(u.value)}
                    className={cn(
                      "flex-1 rounded-[26px] border px-3 py-2 text-sm font-medium transition-all",
                      active
                        ? "border-lime/60 bg-lime/10 text-foreground shadow-[0_0_0_1px_hsl(var(--lime)/0.3)]"
                        : "border-foreground/10 bg-surface-1 text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                    )}
                  >
                    {u.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={fieldLabel} htmlFor="issue-type">
              Issue Type *
            </label>
            <Select value={issueType} onValueChange={setIssueType}>
              <SelectTrigger
                id="issue-type"
                className="mt-2 w-full rounded-[26px]! h-10! border border-foreground/10 bg-surface-1 px-3.5 py-2.5 text-sm text-foreground transition-colors hover:border-foreground/20 focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 data-placeholder:text-muted-foreground/60"
              >
                <SelectValue placeholder="Select an issue type" />
              </SelectTrigger>
              <SelectContent className="border-foreground/10 bg-background">
                {issueTypes.map((t) => (
                  <SelectItem
                    key={t}
                    value={t}
                    className="text-sm text-foreground focus:bg-lime/10 focus:text-foreground"
                  >
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {err("issueType")}
          </div>

          <div>
            <label className={fieldLabel} htmlFor="subject">
              Subject *
            </label>
            <input
              id="subject"
              name="subject"
              placeholder="Brief summary of your request"
              aria-invalid={!!errors.subject}
              aria-describedby={errors.subject ? "err-subject" : undefined}
              className={fieldBase}
            />
            {err("subject")}
          </div>

          <div>
            <label className={fieldLabel} htmlFor="message">
              Message *
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              placeholder="Describe your issue in detail..."
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? "err-message" : undefined}
              className={cn(fieldBase, "resize-none")}
            />
            {err("message")}
            <p className="mt-2 text-xs text-muted-foreground">
              Provide as much detail as possible to help us assist you.
            </p>
          </div>

          <div>
            <span className={fieldLabel}>Attachments (Optional)</span>
            <label
              htmlFor="attachment"
              className="mt-2 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-foreground/15 bg-surface-1 px-4 py-4 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              <Paperclip className="h-4 w-4 text-lime" />
              <span className="flex-1 truncate">
                {fileName ??
                  "Upload screenshots or documents that might help us understand your issue."}
              </span>
              <input
                id="attachment"
                type="file"
                className="hidden"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
              />
            </label>
          </div>

          <label className="flex items-start gap-3 text-sm text-muted-foreground">
            <input
              ref={agreedRef}
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              aria-invalid={!!errors.agreed}
              aria-describedby={errors.agreed ? "err-agreed" : undefined}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-lime"
            />
            <span>
              I agree to the terms and conditions. You agree to our{" "}
              <a href="/terms" className="text-lime hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-lime hover:underline">
                Privacy Policy
              </a>
              .
            </span>
          </label>
          {errors.agreed && (
            <p id="err-agreed" className="-mt-3 text-xs text-red-400">
              {errors.agreed}
            </p>
          )}

          <div className="flex justify-end pt-2">
            <PillButton type="submit" size="md" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Request"}
              {!submitting && <Send className="h-3.5 w-3.5" />}
            </PillButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
