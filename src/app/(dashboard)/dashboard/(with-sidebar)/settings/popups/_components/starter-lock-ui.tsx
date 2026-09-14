"use client";
import { ArrowUpRight, Lock, Zap } from "lucide-react";
import Link from "next/link";

export const StarterLockedUI = () => {
  return (
    <section
      aria-labelledby="settings-panel-title"
      className="dash-card relative h-fit rounded-2xl border border-white/5 bg-surface-1 p-4 sm:p-6"
    >
      {/* Header – same as normal UI but without the "Design popups" button */}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-white/5 pb-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white">
            <Zap className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 id="settings-panel-title" className="font-inter-tight text-xl font-semibold">
              Popups
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Upgrade your plan to create and manage popups.
            </p>
          </div>
        </div>
      </header>

      {/* Main locked content */}
      <div className="flex flex-col items-start justify-center rounded-2xl border border-dashed border-white/10 bg-background p-7 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-muted-foreground">
          <Lock className="h-8 w-8" />
        </div>
        <h3 className="font-inter-tight mt-3 text-lg font-semibold">
          Popups are not available on your current plan
        </h3>
        <p className="mt-2 text-start max-w-md text-sm text-muted-foreground">
          Upgrade to <strong>Pro</strong> or <strong>Business</strong> to unlock powerful popup
          features. Engage your guests with targeted offers, announcements, and events – and track
          performance with built‑in analytics.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <FeatureItem text="Unlimited popups" />
          <FeatureItem text="Custom triggers (time, scroll, exit)" />
          <FeatureItem text="A/B testing" />
          <FeatureItem text="Detailed analytics" />
        </div>
        <Link
          href="/dashboard/settings/subscription"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-background transition hover:bg-white/90"
        >
          Upgrade now <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
};

const FeatureItem = ({ text }: { text: string }) => (
  <div className="flex items-center gap-2 text-xs text-muted-foreground">
    <span className="text-white">✓</span> {text}
  </div>
);
