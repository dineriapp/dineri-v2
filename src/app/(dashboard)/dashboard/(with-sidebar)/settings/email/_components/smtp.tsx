"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/hooks/use-auth";
import { canUseCustomSmtp } from "@/lib/stripe/checkers";
import {
  useTestSmtpConfig,
  useVerifySmtpCode,
} from "@/lib/tanstack-react-query/hooks/email-integration";
import { SmtpTestInput, smtpTestSchema } from "@/lib/validators/zod/smtp";
import { updateSelectedRestaurant, useSelectedRestaurant } from "@/stores/restaurant-store";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AtSign as AtIcon,
  AtSign,
  ChevronRight,
  Key,
  Lock,
  Mail,
  Server,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

type Step = "platform" | "form" | "verifying" | "success";

export function SMTPSettings() {
  const restaurant = useSelectedRestaurant();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(
    restaurant.isEmailIntegrationDone ? "success" : "platform",
  );
  const [verificationCode, setVerificationCode] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const canCustom = canUseCustomSmtp(user?.subscription?.plan ?? "starter");

  const testMutation = useTestSmtpConfig();
  const verifyMutation = useVerifySmtpCode();

  const form = useForm<SmtpTestInput>({
    resolver: zodResolver(smtpTestSchema),
    defaultValues: {
      smtpHost: "",
      smtpPort: 587,
      smtpSecure: false,
      smtpUsername: "",
      smtpPassword: "",
      fromEmail: "",
      fromName: "",
      testEmail: "",
    },
  });

  const onSubmit = (data: SmtpTestInput) => {
    testMutation.mutate(data, {
      onSuccess: () => {
        setTestEmail(data.testEmail);
        setStep("verifying");
      },
    });
  };

  const handleVerify = () => {
    if (!verificationCode || verificationCode.length !== 4) {
      // set an error locally if you want; or rely on mutation error
      return;
    }
    verifyMutation.mutate(verificationCode, {
      onSuccess: (data) => {
        updateSelectedRestaurant({
          email_config: data.email_config ?? null,
          isEmailIntegrationDone: data.isEmailIntegrationDone,
        });
        setStep("success");
      },
    });
  };

  const handleReset = () => {
    setStep("form");
    setVerificationCode("");
    updateSelectedRestaurant({
      email_config: null,
      isEmailIntegrationDone: false,
    });
    form.reset();
  };

  if (step === "platform") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AtSign className="h-3.5 w-3.5 text-white" />
          <h3 className="text-sm font-semibold">Outgoing mail (SMTP)</h3>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface-1">
          {/* Current sender */}
          <div className="flex items-start gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white">
              <Mail className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-semibold">Sending via Dineri</h4>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white">
                  <ShieldCheck className="h-3 w-3" /> Active
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Your notifications go out on Dineri&rsquo;s shared platform email - nothing to set
                up.
              </p>
              <div className="mt-2.5 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-background px-2.5 py-1.5">
                <AtSign className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <code className="font-jetbrains-mono text-xs text-foreground/90">
                  contact@dineri.app
                </code>
              </div>
            </div>
          </div>

          {/* Custom SMTP: action or upgrade gate */}
          <div className="border-t border-white/5 bg-background/40 p-4">
            {canCustom ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-surface-1 text-muted-foreground">
                    <Server className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Use your own email</div>
                    <p className="text-xs text-muted-foreground">
                      Send from your own domain via custom SMTP.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep("form")}
                  className="w-full shrink-0 sm:w-auto"
                >
                  Set up SMTP <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-surface-1 text-muted-foreground">
                    <Lock className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Custom email domain</div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Send from your own address (e.g.{" "}
                      <span className="text-foreground/80">hello@yourvenue.com</span>). Available on
                      a higher plan.
                    </p>
                  </div>
                </div>
                <Link
                  href="/dashboard/settings/subscription"
                  className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-background transition hover:bg-white/90 sm:w-auto"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Upgrade plan
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AtSign className="h-3.5 w-3.5 text-white" />
          <h3 className="text-sm font-semibold">Outgoing mail (SMTP)</h3>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/20">
          <p className="text-sm text-green-700 dark:text-green-400">SMTP integration is active.</p>
          <div className="mt-2 text-xs text-muted-foreground">
            <p>From: {restaurant?.email_config?.fromEmail}</p>
            <p>Provider: {restaurant?.email_config?.smtpHost}</p>
            <p>Test email: {restaurant?.email_config?.testEmail ?? "--"}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset} className="mt-3">
            Reconfigure
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <AtSign className="h-3.5 w-3.5 text-white" />
        <h3 className="text-sm font-semibold">Outgoing mail (SMTP)</h3>
      </div>

      {step === "form" ? (
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5 sm:grid-cols-2">
          {/* SMTP Host */}
          <Controller
            name="smtpHost"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="col-span-2 sm:col-span-1">
                <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                  SMTP Host *
                </FieldLabel>
                <div className="relative flex items-center">
                  <Server className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 text-muted-foreground" />
                  <Input
                    {...field}
                    className="h-9 w-full rounded-lg pl-10"
                    placeholder="smtp.gmail.com"
                    aria-invalid={fieldState.invalid}
                  />
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                )}
              </Field>
            )}
          />

          {/* SMTP Port */}
          <Controller
            name="smtpPort"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="col-span-2 sm:col-span-1">
                <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                  Port *
                </FieldLabel>
                <div className="relative flex items-center">
                  <Key className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 text-muted-foreground" />
                  <Input
                    {...field}
                    type="number"
                    className="h-9 w-full rounded-lg pl-10"
                    placeholder="587"
                    aria-invalid={fieldState.invalid}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                  />
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                )}
              </Field>
            )}
          />

          {/* SMTP Username */}
          <Controller
            name="smtpUsername"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="col-span-2 sm:col-span-1">
                <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                  Username *
                </FieldLabel>
                <div className="relative flex items-center">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 text-muted-foreground" />
                  <Input
                    {...field}
                    className="h-9 w-full rounded-lg pl-10"
                    placeholder="your-email@gmail.com"
                    aria-invalid={fieldState.invalid}
                  />
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                )}
              </Field>
            )}
          />

          {/* SMTP Password */}
          <Controller
            name="smtpPassword"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="col-span-2 sm:col-span-1">
                <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                  Password *
                </FieldLabel>
                <div className="relative flex items-center">
                  <ShieldCheck className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 text-muted-foreground" />
                  <Input
                    {...field}
                    type="password"
                    className="h-9 w-full rounded-lg pl-10"
                    placeholder="••••••••"
                    aria-invalid={fieldState.invalid}
                  />
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                )}
              </Field>
            )}
          />

          {/* From Email */}
          <Controller
            name="fromEmail"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="col-span-2 sm:col-span-1">
                <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                  From Email *
                </FieldLabel>
                <div className="relative flex items-center">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 text-muted-foreground" />
                  <Input
                    {...field}
                    className="h-9 w-full rounded-lg pl-10"
                    placeholder="sender@example.com"
                    aria-invalid={fieldState.invalid}
                  />
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                )}
              </Field>
            )}
          />

          {/* From Name */}
          <Controller
            name="fromName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="col-span-2 sm:col-span-1">
                <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                  From Name (optional)
                </FieldLabel>
                <div className="relative flex items-center">
                  <AtIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 text-muted-foreground" />
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    className="h-9 w-full rounded-lg pl-10"
                    placeholder="Your Company"
                    aria-invalid={fieldState.invalid}
                  />
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                )}
              </Field>
            )}
          />

          {/* Secure (SSL) – checkbox */}
          <Controller
            name="smtpSecure"
            control={form.control}
            render={({ field }) => (
              <Field className="col-span-2 ">
                <div className="flex items-center gap-2">
                  <div className="w-fit">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="smtpSecure"
                    />
                  </div>
                  <Label htmlFor="smtpSecure" className="text-sm font-medium">
                    Use SSL/TLS (port 465)
                  </Label>
                </div>
              </Field>
            )}
          />

          {/* Test Email (receive verification code) */}
          <Controller
            name="testEmail"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="col-span-2">
                <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                  Test Email (to receive code and test emails) *
                </FieldLabel>
                <div className="relative flex items-center">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 text-muted-foreground" />
                  <Input
                    {...field}
                    className="h-9 w-full rounded-lg pl-10"
                    placeholder="your-test@example.com"
                    aria-invalid={fieldState.invalid}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  We&apos;ll send a 4‑digit code to verify your credentials.
                </p>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                )}
              </Field>
            )}
          />

          {/* Submit & Errors */}
          <div className="col-span-2 flex flex-col gap-2">
            {testMutation.isError && (
              <div className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-600">
                {testMutation.error?.message || "Failed to send test email."}
              </div>
            )}
            <Button
              type="submit"
              disabled={testMutation.isPending}
              className="w-full sm:w-auto text-black h-10"
            >
              {testMutation.isPending ? "Sending..." : "Send Verification Code"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We sent a 4‑digit code to <strong>{testEmail}</strong>. Enter it below to confirm your
            SMTP configuration.
          </p>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="h-10 w-32 text-center text-2xl font-mono"
                placeholder="0000"
                maxLength={4}
                autoFocus
              />
            </div>
            <Button
              onClick={handleVerify}
              disabled={verifyMutation.isPending || verificationCode.length < 4}
            >
              {verifyMutation.isPending ? "Verifying..." : "Verify Code"}
            </Button>
            <Button variant="ghost" onClick={handleReset}>
              Retry
            </Button>
          </div>

          {verifyMutation.isError && (
            <div className="rounded  bg-red-800 p-2 text-sm text-white">
              {verifyMutation.error?.message || "Verification failed."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
