"use client";

import TopBar from "@/app/(dashboard)/dashboard/_components/top-bar";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Lock, Sparkles } from "lucide-react";
import Link from "next/link";

interface FeatureNotAvailableProps {
  featureName?: string;
  description?: string;
  requiredPlan?: "growth" | "scale";
  showBackButton?: boolean;
}

const FeatureNotAvailable = ({
  featureName = "Success Stories",
  description = "Share customer wins and partner stories to build social proof and attract more customers.",
  requiredPlan = "growth",
  showBackButton = true,
}: FeatureNotAvailableProps) => {
  const planNames = {
    growth: "Growth",
    scale: "Scale",
  };
  console.log(description);
  return (
    <>
      {showBackButton && <TopBar page={featureName} />}
      <div
        className={cn(
          "flex  items-center justify-center p-6",
          showBackButton ? "min-h-[calc(100vh-120px)]" : "min-h-screen",
        )}
      >
        <div className="w-full max-w-md animate-fade-in">
          {/* Icon container */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-lime/10 via-emerald-500/5 to-transparent border border-white/10">
            <Lock className="h-8 w-8 text-lime" strokeWidth={1.5} />
          </div>

          {/* Title & badge */}
          <div className="text-center">
            <div className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/5 px-2.5 py-0.5 text-[10px] font-medium text-amber-500">
              <Sparkles className="mr-1 h-2.5 w-2.5" />
              Plan upgrade required
            </div>
            <h1 className="mt-4 font-inter-tight text-2xl font-semibold tracking-tight">
              {featureName} not available
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your current plan does not include {featureName.toLowerCase()}. Upgrade to{" "}
              <span className="font-medium text-lime">{planNames[requiredPlan]}</span> or higher to
              unlock this feature.
            </p>
          </div>
          {/* Upgrade CTA */}
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/dashboard/settings/subscription"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-lime text-sm font-semibold text-background transition hover:bg-lime-soft"
            >
              Upgrade plan <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Footer hint */}
          <p className="mt-6 text-center text-[10px] text-muted-foreground">
            Need help? Contact our support team - we&apos;re happy to help you choose the right
            plan.
          </p>
        </div>
      </div>
    </>
  );
};

export default FeatureNotAvailable;
