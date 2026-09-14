"use client";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PillButton } from "@/components/ui/ui-kit/PillButton";
import { authClient } from "@/lib/auth/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader } from "lucide-react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const forgotSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address")
    .max(255, "Email is too long"),
});

type forgotSchemaValues = z.infer<typeof forgotSchema>;

const ForgotPasswordPage = () => {
  const form = useForm<forgotSchemaValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: "",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });
  const { isSubmitting } = form.formState;

  const handleSubmit = async (data: forgotSchemaValues) => {
    await authClient.requestPasswordReset(
      {
        ...data,
        redirectTo: "/reset-password",
      },
      {
        onError: (error) => {
          toast.error(error.error.message || "Failed to send password reset email");
        },
        onSuccess: () => {
          toast.success("Password reset link sent. Please check your email inbox.");
        },
      },
    );
  };

  return (
    <section className="relative overflow-hidden">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.5]" />
      <div className="pointer-events-none absolute -left-32 top-10 h-105 w-105 rounded-full bg-lime/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-105 w-105 rounded-full bg-lime/10 blur-[120px]" />

      <div className="relative mx-auto flex max-w-xl flex-col px-6 py-20 lg:py-28">
        <div className="space-y-1">
          <div className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[11px] text-muted-foreground">
            /04 - Reset password
          </div>
          <h1 className="font-inter-tight text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
            <span>Forgot </span>
            <span className="text-lime">password?</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            No worries. Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="mt-5 space-y-3 rounded-2xl border border-white/5 bg-surface-1 p-7"
        >
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-2">
                <FieldLabel className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
                  Email
                </FieldLabel>
                <Input
                  {...field}
                  className="h-11 w-full "
                  placeholder={"you@venue.com"}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                )}
              </Field>
            )}
          />
          <PillButton disabled={isSubmitting} size="lg" className="mt-3 w-full" type="submit">
            {isSubmitting && <Loader className="animate-spin size-4" />}
            Send reset link
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

export default ForgotPasswordPage;
