"use client";
import { PageHeader } from "@/components/shared/page-header";
import { z } from "zod";
import { CheckCircle2, Clock, Headset, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { PillButton } from "@/components/ui/ui-kit/PillButton";
import { submitDemoRequest } from "@/server/actions/submit-forms.action";
import { COUNTRIES } from "@/lib/countries";

const perks = [
  {
    icon: Clock,
    title: "30-minute walkthrough",
    desc: "We walk you through everything Dineri has to offer, tailored to your restaurant and your guests.",
  },
  {
    icon: Headset,
    title: "Your restaurant, live",
    desc: "We set up a demo page for your restaurant, so you can see exactly how it looks for you and your guests.",
  },
  {
    icon: ShieldCheck,
    title: "No commitment",
    desc: "No rush. We might be a perfect fit  or we might not. Let's find out together.",
  },
];

const schema = z.object({
  business: z.string().trim().min(1, "Business name is required").max(150),
  contact: z
    .string()
    .trim()
    .min(1, "Contact person is required")
    .max(100)
    .regex(/^[\p{L}\s'.-]+$/u, "Please use letters only"),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z
    .string()
    .trim()
    .min(6, "Phone number is required")
    .max(20)
    .regex(/^[0-9]+$/, "Digits only, please"),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  country: z.string().trim().min(1, "Please select a country").max(100),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

const DemoPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries()) as Record<string, string>;
    const result = schema.safeParse(data);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((i) => {
        const k = i.path[0] as string;
        if (!errs[k]) errs[k] = i.message;
      });
      setErrors(errs);
      toast.error("Please review the form", {
        description: "Some fields need your attention.",
      });
      return;
    }
    setErrors({});
    setSubmitting(true);
    const res = await submitDemoRequest(result.data);
    setSubmitting(false);
    if (!res.success) {
      toast.error("Something went wrong", { description: res.error });
      return;
    }
    setSubmitted(true);
  };

  return (
    <>
      <PageHeader
        number="03"
        label="Book a demo"
        headline={[{ plain: "See your restaurant  " }, { white: "live on Dineri" }]}
        description="Fill in your details and we'll reach out to schedule a personal demo. No slides, no scripts. Just your restaurant."
      />
      <section className="relative">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_1.2fr] lg:gap-16 lg:px-8 lg:py-28">
          {/* Perks */}
          <aside className="space-y-8">
            <div>
              <div className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[11px] text-white">
                /WHAT TO EXPECT
              </div>
              <h2 className="font-inter-tight mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                What happens next?
              </h2>
            </div>
            <ul className="space-y-5">
              {perks.map((p) => {
                const Icon = p.icon;
                return (
                  <li
                    key={p.title}
                    className="flex gap-4 rounded-2xl border border-white/5 bg-surface-1 p-5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/30 bg-white/10 text-white">
                      <Icon className="h-5 w-5" strokeWidth={1.6} />
                    </div>
                    <div>
                      <div className="font-inter-tight text-base font-semibold tracking-tight">
                        {p.title}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="rounded-2xl border border-white/5 bg-linear-to-br from-white/10 to-transparent p-6">
              <div className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[11px] text-white">
                /OUR PROMISE
              </div>
              <p className="mt-2 font-inter-tight text-2xl font-semibold tracking-tight">
                Sometimes it's just not a match. No hard feelings, cancel anytime.
              </p>
            </div>
          </aside>

          {/* Form */}
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-60 w-60 rounded-full bg-white/15 blur-3xl"
            />
            <div className="relative rounded-3xl border border-white/10 bg-surface-1 p-6 sm:p-8 lg:p-10">
              <div className="mb-6">
                <div className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[11px] text-muted-foreground">
                  /REQUEST A DEMO
                </div>
                <h3 className="font-inter-tight mt-2 text-2xl font-bold tracking-tight">
                  Tell us about your restaurant
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Fill in your business detauks and we'll reach out withing 1 business day to
                  schedule a personal demo. No slides, no scripts. Just your live restaurant.
                </p>
              </div>

              {submitted ? (
                <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/30 bg-white/5 p-10 text-center">
                  <CheckCircle2 className="h-10 w-10 text-white" strokeWidth={1.6} />
                  <h4 className="font-inter-tight text-xl font-bold">Request received.</h4>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    A specialist will reach out within one business day to schedule your
                    personalized demo.
                  </p>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-5" noValidate>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      label="Business Name"
                      name="business"
                      required
                      placeholder="Dineri Milano"
                      error={errors.business}
                    />
                    <Field
                      label="Contact Person"
                      name="contact"
                      required
                      alpha
                      placeholder="Giulia Rossi"
                      error={errors.contact}
                    />
                    <Field
                      label="Email"
                      name="email"
                      type="email"
                      required
                      placeholder="you@restaurant.com"
                      error={errors.email}
                    />
                    <Field
                      label="Phone"
                      name="phone"
                      type="tel"
                      required
                      numeric
                      placeholder="39123456789"
                      error={errors.phone}
                    />
                    <Field
                      label="Address"
                      name="address"
                      placeholder="Via Brera 12"
                      error={errors.address}
                    />
                    <Field label="City" name="city" placeholder="Milan" error={errors.city} />
                    <div className="sm:col-span-2">
                      <Field
                        label="Country"
                        name="country"
                        required
                        select
                        options={COUNTRIES}
                        placeholder="Select your country"
                        error={errors.country}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Field
                        label="Additional Notes"
                        name="notes"
                        textarea
                        placeholder="Tell us about your venue, current tools, what you'd like to see…"
                        error={errors.notes}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted-foreground">
                      By submitting you agree to our{" "}
                      <a href="#privacy" className="underline hover:text-foreground">
                        privacy policy
                      </a>
                      .
                    </p>
                    <PillButton type="submit" size="lg" disabled={submitting} className="shrink-0">
                      {submitting ? "Sending…" : "Submit Request →"}
                    </PillButton>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default DemoPage;

interface FieldProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  select?: boolean;
  options?: string[];
  /** digits only */
  numeric?: boolean;
  /** letters, spaces and name punctuation only */
  alpha?: boolean;
  placeholder?: string;
  error?: string;
}

const inputClass =
  "h-11 w-full rounded-xl border border-white/10 bg-background/60 px-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/20";

const Field = ({
  label,
  name,
  type = "text",
  required,
  textarea,
  select,
  options,
  numeric,
  alpha,
  placeholder,
  error,
}: FieldProps) => {
  const filter: React.FormEventHandler<HTMLInputElement> | undefined = numeric
    ? (e) => {
        e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, "");
      }
    : alpha
      ? (e) => {
          e.currentTarget.value = e.currentTarget.value.replace(/[^\p{L}\s'.-]/gu, "");
        }
      : undefined;

  return (
    <label className="block">
      <span className="font-jetbrains-mono uppercase tracking-[0.12rem] mb-2 block text-[11px] text-muted-foreground">
        {label} {required && <span className="text-white">*</span>}
      </span>
      {textarea ? (
        <textarea
          name={name}
          rows={4}
          placeholder={placeholder}
          className="w-full resize-none rounded-xl border border-white/10 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/20"
        />
      ) : select ? (
        <select name={name} defaultValue="" className={inputClass}>
          <option value="" disabled>
            {placeholder ?? "Select…"}
          </option>
          {options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          inputMode={numeric ? "numeric" : undefined}
          onInput={filter}
          className={inputClass}
        />
      )}
      {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
    </label>
  );
};
