"use client";
import { SectionTag } from "@/components/ui/ui-kit/Eyebrow";
import { Reveal } from "@/components/ui/ui-kit/Reveal";
import { RichHeadline } from "@/components/ui/ui-kit/RichHeadline";
import { Check } from "lucide-react";

export const Comparison = () => {
  const c = {
    sectionNumber: "02",
    sectionLabel: "Why Dineri",
    headline: [{ plain: "Most restaurants are leaving money on the table. " }, { muted: "Why?" }],
    generic: {
      title: "Generic bio link",
      items: [
        "Static list of links",
        "No menu structure or allergens",
        "Sends bookings off-platform",
        "No table QR or seat tracking",
        "Generic vanity click count",
      ],
    },
    dineri: {
      title: "Dineri",
      items: [
        "Restaurant-native components",
        "Menu, modifiers, allergens and add-ons",
        "Direct, commission-free reservations",
        "Per-table QR with scan attribution",
        "Funnel analytics: view → book → arrive",
      ],
    },
  };

  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
        <SectionTag number={c.sectionNumber} label={c.sectionLabel} />
        <h2 className="font-inter-tight mt-5 max-w-3xl text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-[56px]">
          <RichHeadline tokens={c.headline} />
        </h2>

        <div className="mt-14 grid gap-4 lg:grid-cols-2">
          {/* Generic */}
          <Reveal>
            <div className="hover-lift h-full rounded-2xl border border-foreground/5 bg-surface-1/50 p-7">
              <div className="mb-7 flex items-center justify-between">
                <span className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[11px] text-muted-foreground">
                  {c.generic.title}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-foreground/20" />
              </div>
              <ul className="space-y-3.5">
                {c.generic.items.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="text-foreground/30">-</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Dineri */}
          <Reveal delay={120}>
            <div className="hover-lift relative h-full overflow-hidden rounded-2xl border border-white/20 bg-surface-1 p-7">
              <div
                className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 animate-float rounded-full bg-white/10 blur-3xl"
                aria-hidden
              />
              <div className="relative mb-7 flex items-center justify-between">
                <span className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[11px] text-white">
                  {c.dineri.title}
                </span>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              </div>
              <ul className="relative space-y-3.5">
                {c.dineri.items.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-white" strokeWidth={2.5} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
