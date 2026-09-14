"use client";

import { PillButton } from "@/components/ui/ui-kit/PillButton";
import { authClient } from "@/lib/auth/client";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { EyeIcon, EyeOffIcon, Loader } from "lucide-react";
import { Input } from "@/components/ui/input";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters").max(128),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters").max(128),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type resetPasswordSchemaValues = z.infer<typeof resetPasswordSchema>;

const ResetPasswordPage = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const Icon = showPassword ? EyeOffIcon : EyeIcon;
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const form = useForm<resetPasswordSchemaValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const { isSubmitting } = form.formState;

  async function handleResetPassword(data: resetPasswordSchemaValues) {
    if (token == null) return;
    await authClient.resetPassword(
      {
        newPassword: data.password,
        token,
      },
      {
        onError: (error) => {
          toast.error(error.error.message || "Failed to reset password");
        },
        onSuccess: () => {
          toast.success("Password reset successful", {
            description: "Redirection to login...",
          });
          setTimeout(() => {
            router.push("/sign-in");
          }, 1000);
        },
      },
    );
  }

  return (
    <section className="relative overflow-hidden">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.5]" />
      <div className="pointer-events-none absolute -left-32 top-10 h-105 w-105 rounded-full bg-lime/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-105 w-105 rounded-full bg-lime/10 blur-[120px]" />

      <div className="relative mx-auto flex max-w-xl flex-col px-6 py-20 lg:py-28">
        <div>
          <div className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[11px] text-muted-foreground">
            /05 - Create new password
          </div>
          <h1 className="font-inter-tight text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
            <span>Reset </span>
            <span className="text-lime">password.</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Choose a strong password that you haven&apos;t used before.
          </p>
        </div>

        <form
          onSubmit={form.handleSubmit(handleResetPassword)}
          noValidate
          className="mt-5 space-y-3 rounded-2xl border border-white/5 bg-surface-1 p-7"
        >
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-2">
                <FieldLabel className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
                  Password
                </FieldLabel>
                <div className="relative flex items-center">
                  <Input
                    {...field}
                    type={showPassword ? "text" : "password"}
                    className="h-11 w-full "
                    placeholder={"********"}
                    aria-invalid={fieldState.invalid}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-4 cursor-pointer"
                  >
                    <Icon className="size-4.5" />
                    <span className="sr-only">
                      {showPassword ? "Hide password" : "Show password"}
                    </span>
                  </button>
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                )}
              </Field>
            )}
          />
          <Controller
            name="confirmPassword"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-2">
                <FieldLabel className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
                  Confirm Password
                </FieldLabel>
                <div className="relative flex items-center">
                  <Input
                    {...field}
                    type={showPassword ? "text" : "password"}
                    className="h-11 w-full "
                    placeholder={"********"}
                    aria-invalid={fieldState.invalid}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-4 cursor-pointer"
                  >
                    <Icon className="size-4.5" />
                    <span className="sr-only">
                      {showPassword ? "Hide password" : "Show password"}
                    </span>
                  </button>
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                )}
              </Field>
            )}
          />
          {/* submit  */}
          <PillButton disabled={isSubmitting} size="lg" className="mt-3 w-full" type="submit">
            {isSubmitting && <Loader className="animate-spin size-4" />}
            Reset password
          </PillButton>

          <div className="mt-3 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/5" />
            <span className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
              or
            </span>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          <PillButton size="lg" variant="outline" className="mt-3 w-full" type="button">
            <Link href="/sign-in">Back to sign in</Link>
          </PillButton>
        </form>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link
            href="/sign-in"
            className="text-foreground underline-offset-4 transition-colors hover:text-lime hover:underline"
          >
            Sign in
          </Link>
        </div>

        <div className="mt-4 text-center font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            ← Back to home
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ResetPasswordPage;
