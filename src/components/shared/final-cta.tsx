import { SectionTag } from "@/components/ui/ui-kit/Eyebrow";
import { PillButton } from "@/components/ui/ui-kit/PillButton";
import { Reveal } from "@/components/ui/ui-kit/Reveal";
import { RichHeadline } from "@/components/ui/ui-kit/RichHeadline";

export const FinalCTA = () => {
  const c = {
    sectionNumber: "03",
    sectionLabel: "Get started",
    headline: [{ plain: "Your restaurant, " }, { lime: "can be live " }, { plain: "by tonight." }],
    description:
      "Set up your Dineri page in 10 minutes. We handle everything. You focus on your guests.",
    cta: { label: "Start your free month", href: "/start" },
    microcopy: "No credit card · No commission · Cancel anytime",
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
