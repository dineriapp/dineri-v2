"use client";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PillButton } from "@/components/ui/ui-kit/PillButton";
import { authClient } from "@/lib/auth/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon, Loader } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { SocialAuthButtons } from "./social-login/social-auth-buttons";

const signinSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address")
    .max(255, "Email is too long"),
  password: z
    .string()
    .trim()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
});

type signinSchemaValues = z.infer<typeof signinSchema>;

const SigninPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const [showPassword, setShowPassword] = useState(false);
  const Icon = showPassword ? EyeOffIcon : EyeIcon;
  const [loading, setLoading] = useState<boolean>(false);
  const form = useForm<signinSchemaValues>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const handleSubmit = async (data: signinSchemaValues) => {
    try {
      setLoading(true);
      const res = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        rememberMe: true,
      });
      if (res.error) {
        if (res.error.code === "EMAIL_NOT_VERIFIED") {
          return toast.error(
            "Email not verified. Please check your email inbox to verify your account.",
          );
        }
        return toast.error(res.error.message);
      }
      toast.success("Logged in successfully");
      router.push(res.data?.user.role === "admin" ? "/admin" : "/dashboard");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.5]" />
        <div className="pointer-events-none absolute -left-32 top-10 h-105 w-105 rounded-full bg-lime/10 blur-[120px]" />
        <div className="pointer-events-none absolute -right-32 bottom-0 h-105 w-105 rounded-full bg-lime/10 blur-[120px]" />

        <div className="relative mx-auto flex max-w-xl flex-col px-6 py-20 lg:py-28">
          {/* heading  */}
          <div className="space-y-1">
            <div className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[11px] text-muted-foreground">
              /00 - Sign in
            </div>
            <h1 className="font-inter-tight text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
              <>
                <span>Welcome </span>
                <span className="text-lime">back.</span>
              </>
            </h1>
            <p className="text-sm text-muted-foreground">Sign in to your Dineri dashboard</p>
          </div>
          {/* form  */}
          <FormProvider {...form}>
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
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-2">
                    <FieldLabel className="font-jetbrains-mono flex items-center justify-between uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
                      Password
                      <Link
                        href={"/forgot-password"}
                        type="button"
                        className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-white hover:underline hover:text-lime"
                      >
                        Forgot password?
                      </Link>
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

              <PillButton
                disabled={form.formState.isSubmitting || loading}
                size="lg"
                className="mt-3 w-full"
                type="submit"
              >
                {(form.formState.isSubmitting || loading) && (
                  <Loader className="animate-spin size-4" />
                )}
                Sign in
              </PillButton>

              <div className="mt-3 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/5" />
                <span className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
                  or
                </span>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              {/* google button  */}
              <SocialAuthButtons className="w-full h-12!" redirect={redirect ?? "/dashboard"} />
            </form>
          </FormProvider>

          {/* bottom  */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            New to Dineri?{" "}
            <Link
              type="button"
              href={"/sign-up"}
              className="text-foreground underline-offset-4 transition-colors hover:text-lime hover:underline"
            >
              Start free
            </Link>
          </div>
          <div className="mt-4 text-center font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              ← Back to home
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default SigninPage;
