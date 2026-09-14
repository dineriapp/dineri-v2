import { SectionTag } from "@/components/ui/ui-kit/Eyebrow";
import { PillButton } from "@/components/ui/ui-kit/PillButton";
import { Reveal } from "@/components/ui/ui-kit/Reveal";
import { RichHeadline } from "@/components/ui/ui-kit/RichHeadline";

export const FinalCTA = () => {
  const c = {
    sectionNumber: "03",
    sectionLabel: "Ship today",
    headline: [{ plain: "Your bio link, " }, { lime: "earning " }, { plain: "by tonight." }],
    description:
      "Build your menu, take bookings and start selling - all from one link. Free forever, upgrade only when you outgrow it.",
    cta: { label: "Start free → dineri.app/start", href: "/start" },
    microcopy: "No credit card · €0 commission · GDPR",
  };

  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-foreground/5 bg-surface-1 p-10 lg:p-16">
            {/* Glow on the right */}
            <div
              className="pointer-events-none absolute -right-32 -top-20 h-125 w-150 animate-float rounded-full bg-lime/15 blur-[120px]"
              aria-hidden
            />
            <div
              className="bg-grid-fine pointer-events-none absolute inset-0 opacity-40"
              aria-hidden
            />

            <div className="relative grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
              <div>
                <SectionTag number={c.sectionNumber} label={c.sectionLabel} />
                <h2 className="font-inter-tight mt-5 max-w-2xl text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-[64px]">
                  <RichHeadline tokens={c.headline} />
                </h2>
                <p className="mt-6 max-w-md text-base text-muted-foreground">{c.description}</p>
              </div>

              <div className="flex flex-col items-start gap-3 lg:items-end">
                <a href={c.cta.href}>
                  <PillButton size="lg">{c.cta.label}</PillButton>
                </a>
                <div className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
                  {c.microcopy}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
