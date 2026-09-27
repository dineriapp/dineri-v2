"use client";

import { authClient } from "@/lib/auth/client";
import { captchaHeaders, preloadRecaptcha } from "@/lib/recaptcha/client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { readPendingVerificationEmail } from "./pending-verification";

const RESEND_COOLDOWN_SECONDS = 60;

const VerifyEmailPage = () => {
  const [email, setEmail] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    setEmail(readPendingVerificationEmail());
  }, []);

  useEffect(() => {
    if (email) preloadRecaptcha();
  }, [email]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email) return;
    try {
      setSending(true);
      const res = await authClient.sendVerificationEmail(
        { email, callbackURL: "/dashboard" },
        { headers: await captchaHeaders("resend_verification") },
      );
      if (res.error) {
        return toast.error(res.error.message || "Couldn't resend the email. Please try again.");
      }
      toast.success("Verification email sent again.");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="relative overflow-hidden">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.5]" />
      <div className="pointer-events-none absolute -left-32 top-10 h-105 w-105 rounded-full bg-lime/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-105 w-105 rounded-full bg-lime/10 blur-[120px]" />

      <div className="relative mx-auto flex max-w-xl flex-col px-6 py-20 lg:py-28">
        <div className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[11px] text-muted-foreground">
          /07 - Verify email
        </div>
        <h1 className="font-inter-tight mt-1 text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
          <span>Check your </span>
          <span className="text-lime">inbox.</span>
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          We&apos;ve sent a verification link to{" "}
          {email ? (
            <span className="font-medium text-foreground break-all">{email}</span>
          ) : (
            "your email"
          )}
          . Click it to activate your account.
        </p>

        <p className="mt-8 text-sm text-muted-foreground">
          Didn&apos;t get it? Check your spam folder
          {email ? (
            <>
              {" or "}
              <button
                type="button"
                onClick={handleResend}
                disabled={sending || cooldown > 0}
                className="cursor-pointer text-foreground underline-offset-4 transition-colors hover:text-lime hover:underline disabled:cursor-default disabled:text-muted-foreground disabled:no-underline"
              >
                {sending ? "sending…" : cooldown > 0 ? `resend in ${cooldown}s` : "resend it"}
              </button>
            </>
          ) : (
            ", or sign in to get a new link"
          )}
          .
        </p>

        <div className="mt-10 font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
          <Link href="/sign-in" className="hover:text-foreground">
            ← Back to sign in
          </Link>
        </div>
      </div>
    </section>
  );
};

export default VerifyEmailPage;
