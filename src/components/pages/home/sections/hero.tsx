import { Eyebrow } from "@/components/ui/ui-kit/Eyebrow";
import { PhoneMockup } from "@/components/ui/ui-kit/PhoneMockup";
import { PillButton } from "@/components/ui/ui-kit/PillButton";
import { RichHeadline } from "@/components/ui/ui-kit/RichHeadline";
import { Check, Play } from "lucide-react";
import Link from "next/link";

const COPY = {
  eyebrow: "BUILT FOR INDEPENDENT RESTAURANT",
  headline: {
    lead: "The quiet",
    middle: "infrastructure",
    tail: "behind full",
    emphasis: "tables",
  },
  subhead:
    "No-shows, missed reservations and outdated websites are costing you money everv day. Dineri  fixes that. One platform, zero commission, full tables.",
  ctaPrimary: "Start free",
  ctaSecondary: "Watch a quick demo",
  badges: ["Live in 10 mintes", "First month free", "No credit card required"],
} as const;

export const Hero = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Background grid + glows */}
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.55]" />
      <div className="pointer-events-none absolute -left-40 top-10 h-130 w-130 rounded-full bg-white/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-[-10%] top-32 h-115 w-115 rounded-full bg-white/10 blur-[110px]" />

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 sm:pb-24 sm:pt-14 lg:px-8 lg:pb-32 lg:pt-20">
        <div className="grid items-center gap-10 sm:gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          {/* Left */}
          <div className="animate-fade-up">
            <Eyebrow className="uppercase leading-5">{COPY.eyebrow}</Eyebrow>

            <h1 className="font-inter-tight mt-6 text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-[72px] lg:leading-[1.02]">
              <RichHeadline
                tokens={[
                  { plain: `${COPY.headline.lead} ` },
                  { muted: `${COPY.headline.middle} ` },
                  { plain: `${COPY.headline.tail} ` },
                  { white: COPY.headline.emphasis },
                ]}
              />
            </h1>

            <p className="mt-7 max-w-lg text-base leading-normal text-muted-foreground sm:text-lg">
              {COPY.subhead}
            </p>

            <div className="mt-9 flex flex-col gap-3 min-[440px]:flex-row min-[440px]:flex-wrap">
              <Link href={"/start"} className="w-full min-[440px]:w-auto">
                <PillButton size="lg" className="w-full min-[440px]:w-auto">
                  {COPY.ctaPrimary}
                </PillButton>
              </Link>
              <Link href={"#tour"} className="w-full min-[440px]:w-auto">
                <PillButton size="lg" variant="outline" className="w-full min-[440px]:w-auto">
                  <Play className="h-3.5 w-3.5 shrink-0 fill-current" /> {COPY.ctaSecondary}
                </PillButton>
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2">
              {COPY.badges.map((badge) => (
                <div
                  key={badge}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <Check className="h-3.5 w-3.5 text-white" /> {badge}
                </div>
              ))}
            </div>
          </div>

          {/* Right - phone stage */}
          <div className="relative">
            <div
              className="animate-fade-up relative mx-auto flex min-h-130 w-full max-w-100 items-center justify-center py-8 sm:max-w-110 sm:py-12 lg:h-160 lg:py-0"
              style={{ animationDelay: "120ms" }}
            >
              {/* Pedestal glow behind device */}
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 h-90 w-90 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20 blur-[80px] sm:h-105 sm:w-105"
              />
              {/* Inner ring frame - needs clearance around the device to read as a frame */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-2 inset-y-2 hidden rounded-[40px] border border-foreground/5 min-[360px]:block sm:inset-x-6 sm:inset-y-4"
              />
              {/* Corner ticks */}
              <CornerTicks />
              <PhoneMockup />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const CornerTicks = () => (
  <>
    {[
      "left-2 top-2",
      "right-2 top-2 rotate-90",
      "left-2 bottom-2 -rotate-90",
      "right-2 bottom-2 rotate-180",
    ].map((pos) => (
      <svg
        key={pos}
        aria-hidden
        className={`pointer-events-none absolute hidden h-4 w-4 text-foreground/15 min-[360px]:block ${pos}`}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      >
        <path d="M1 6V1H6" />
      </svg>
    ))}
  </>
);
