"use client";
import { PillButton } from "@/components/ui/ui-kit/PillButton";
import { RichHeadline } from "@/components/ui/ui-kit/RichHeadline";
import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const STORAGE_KEY = "dineri_welcome_popup_dismissed_v1";

export const WelcomePopup = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY) === "1") return;
    const t = window.setTimeout(() => setOpen(true), 900);
    return () => window.clearTimeout(t);
  }, []);

  const dismiss = () => {
    setOpen(false);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, "1");
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-popup-title"
    >
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm animate-fade-in"
        onClick={dismiss}
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-foreground/5 bg-surface-1 shadow-2xl animate-scale-in">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-60 w-60 animate-float rounded-full bg-lime/15 blur-[100px]"
          aria-hidden
        />
        <div className="bg-grid-fine pointer-events-none absolute inset-0 opacity-40" aria-hidden />

        <button
          onClick={dismiss}
          aria-label="Close welcome"
          className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-background/60 p-1.5 text-muted-foreground backdrop-blur transition hover:border-white/20 hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="relative px-6 pb-6 pt-5 sm:px-7 sm:pb-7">
          <h2
            id="welcome-popup-title"
            className="font-inter-tight mt-4 text-2xl font-semibold leading-[1.1] tracking-tight sm:text-[26px]"
          >
            <RichHeadline
              tokens={[{ plain: "Welcome to " }, { lime: "Dineri" }, { plain: " 👋" }]}
            />
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            One link for your restaurant - menu, reservations, reviews and analytics in under 4
            minutes. Zero commission, forever-free to start.
          </p>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link href="/sign-in" onClick={dismiss} className="flex-1">
              <PillButton className="w-full">
                Get started free <ArrowRight className="h-3.5 w-3.5" />
              </PillButton>
            </Link>
            <PillButton variant="outline" onClick={dismiss}>
              Look around
            </PillButton>
          </div>

          <div className="mt-4 text-center font-jetbrains-mono text-[10px] uppercase tracking-[0.12rem] text-muted-foreground">
            No credit card required · Free forever plan
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
