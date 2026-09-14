"use client";

import { PillButton } from "@/components/ui/ui-kit/PillButton";
import { createRestaurant } from "@/lib/server/func/create-restaurant";
import { Data } from "@/lib/types/onboarding";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Clock,
  Heart,
  Loader,
  Palette,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import AudienceOption from "./audience-option";
import BrandingAndVibe from "./branding-and-vibe";
import { StepFinish } from "./finish-step";
import MenuOptions from "./menu-options";
import OpeningHours from "./opening-hours";
import VenueCreation from "./venue-creation";
import { switchActiveRestaurant } from "@/server/actions/switch-restaurant.action";
import { FIELD_LABEL, fieldAnchorId, FieldErrors, validateStep } from "./validation";
import { BrandLogo } from "@/components/shared/brand-logo";

const DEFAULT_DATA: Data = {
  venue: "",
  cuisine: "",
  city: "",
  phone: "",
  // branding
  brandColor: "#C6F24E",
  vibe: "warm",
  // hours
  hoursFrom: "09:00",
  hoursTo: "23:00",
  closedDays: [],
  menuSize: "medium",
  importMethod: "manual",
  goal: "",
  // Audience
  diners: [],
  dietary: [],
  topCategories: [],
  peakTimes: [],
  avgSpend: "15to30",
  channels: [],
  priorities: [],
  painPoints: [],
  npsAsk: true,
};

const steps = [
  { key: "venue", label: "Venue", icon: Building2 },
  { key: "brand", label: "Brand", icon: Palette },
  { key: "hours", label: "Hours", icon: Clock },
  { key: "menu", label: "Menu", icon: UtensilsCrossed },
  { key: "audience", label: "Diners", icon: Heart },
  { key: "finish", label: "Finish", icon: Sparkles },
] as const;

const OnboardingFlow = () => {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<Data>(DEFAULT_DATA);
  const [showErrors, setShowErrors] = useState(false);

  const Icon = steps[step].icon;

  const errors: FieldErrors = showErrors ? validateStep(step, data) : {};

  const goToStep = (nextStep: number) => {
    setShowErrors(false);
    setStep(nextStep);
  };

  const back = () => goToStep(Math.max(0, step - 1));

  const skip = async () => {
    if (step < steps.length - 1) {
      goToStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const update = <K extends keyof Data>(k: K, v: Data[K]) => setData((d) => ({ ...d, [k]: v }));

  const next = async () => {
    const fieldErrors = validateStep(step, data);

    const missingFields = Object.keys(fieldErrors) as (keyof Data)[];
    if (missingFields.length > 0) {
      setShowErrors(true);
      document
        .getElementById(fieldAnchorId(missingFields[0]))
        ?.scrollIntoView({ behavior: "smooth", block: "center" });

      const names = missingFields.map((field) => FIELD_LABEL[field]).filter(Boolean);
      toast.error(
        names.length === 1 ? `${names[0]} is still empty` : `${names.length} answers are missing`,
        { description: names.join(" · ") },
      );
      return;
    }

    if (step < steps.length - 1) goToStep(step + 1);
    else {
      await handleFinish();
    }
  };

  const handleFinish = async () => {
    try {
      setIsLoading(true);
      const response = await createRestaurant(data);
      if (!response.success) {
        toast.error(response.error);
        return;
      }
      toast.success("Restaurant created");
      const switched = await switchActiveRestaurant(response.restaurantId);
      if (!switched.success) {
        toast.error(switched.error);
        return;
      }
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.4]" />
      <div className="pointer-events-none absolute -left-32 top-10 h-105 w-105 rounded-full bg-lime/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-105 w-105 rounded-full bg-lime/10 blur-[120px]" />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <Link href="/" className="flex items-center" aria-label="Dineri home">
          <BrandLogo className="h-8" />
        </Link>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-2xl px-6 pb-16 pt-4 sm:px-10">
        {/* Step rail */}
        <ol className="mb-8 flex items-center gap-2">
          {steps.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={s.key} className="flex flex-1 items-center gap-2">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition ${
                    done
                      ? "border-lime bg-lime text-background"
                      : active
                        ? "border-lime text-lime"
                        : "border-white/10 text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-px flex-1 ${i < step ? "bg-lime" : "bg-white/10"}`} />
                )}
              </li>
            );
          })}
        </ol>
        <div className="rounded-3xl border border-white/10 bg-surface-1 p-6 sm:p-9">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
              <Icon className="h-3.5 w-3.5" />
              Step {step + 1} of {steps.length} · {steps[step].label}
            </div>
            {step !== 0 && (
              <button
                onClick={skip}
                disabled={isLoading}
                className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground transition hover:text-foreground"
              >
                Skip →
              </button>
            )}
          </div>
          <h1 className="font-inter-tight mt-3 text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {step === 0 && (
              <>
                Tell us about your <span className="text-lime">venue.</span>
              </>
            )}
            {step === 1 && (
              <>
                Pick a <span className="text-lime">brand</span> feel.
              </>
            )}
            {step === 2 && (
              <>
                When are you <span className="text-lime">open?</span>
              </>
            )}
            {step === 3 && (
              <>
                Let&apos;s set up your <span className="text-lime">menu.</span>
              </>
            )}
            {step === 4 && (
              <>
                Who are your <span className="text-lime">diners?</span>
              </>
            )}
            {step === 5 && (
              <>
                You&apos;re <span className="text-lime">ready.</span> 🎉
              </>
            )}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {step === 0 && "We'll prefill your public page with these details."}
            {step === 1 && "You can change everything later in Appearance."}
            {step === 2 && "Used for reservations and the live status badge."}
            {step === 3 && "Don't worry - you can import or edit items anytime."}
            {step === 4 &&
              "Tell us what your customers love - we'll tailor insights, popups and promos to match."}
            {step === 5 && "Your venue is configured. Jump into the dashboard whenever you like."}
          </p>

          <div className="mt-7 space-y-4">
            {step === 0 && <VenueCreation setData={setData} next={next} data={data} />}
            {step === 1 && <BrandingAndVibe update={update} data={data} />}
            {step === 2 && <OpeningHours update={update} data={data} />}
            {step === 3 && <MenuOptions update={update} data={data} />}
            {step === 4 && <AudienceOption update={update} data={data} errors={errors} />}
            {step === 5 && <StepFinish data={data} />}
          </div>

          {step !== 0 && (
            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                onClick={back}
                disabled={step === 0 || isLoading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <PillButton onClick={next} size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader className="h-3.5 w-3.5 animate-spin" />
                    Preparing dashboard...
                  </>
                ) : (
                  <>
                    {step === steps.length - 1 ? "Go to dashboard" : "Continue"}

                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </PillButton>
            </div>
          )}
        </div>

        <p className="mt-6 text-center font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
          Your progress is saved automatically on this device.
        </p>
      </main>
    </div>
  );
};

export default OnboardingFlow;
