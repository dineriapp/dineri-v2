import { PageHeader } from "@/components/shared/page-header";
import { PillButton } from "@/components/ui/ui-kit/PillButton";
import { Compass, Flag, HeartHandshake, Sparkles } from "lucide-react";
import Link from "next/link";

const values = [
  {
    icon: Compass,
    title: "Restaurant-first",
    desc: "Every decision starts with one question — does this help a restaurant serve guests better? If not, it doesn't ship.",
  },
  {
    icon: HeartHandshake,
    title: "Zero commission, always",
    desc: "We charge a flat subscription. Your reservations, orders and revenue are 100% yours. No cuts, no surprises, ever.",
  },
  {
    icon: Sparkles,
    title: "Quietly powerful",
    desc: "The best software disappears into the work. Fast, intuitive and designed to get out of your way.",
  },
  {
    icon: Flag,
    title: "Rooted in Rotterdam",
    desc: "Founded in the Netherlands. Built for independent restaurants worldwide.",
  },
];

const stats = [
  { value: "€0", label: "comossion on every reservation" },
  { value: "10 min", label: "from sign up to go live" },
  { value: "24/7", label: "online bookings accepted" },
  { value: "100%", label: "of every sale is for you" },
];

const timeline = [
  {
    year: "2023",
    title: "The idea",
    desc: "On holiday on a small island, Julian, the founder, picked up his phone to find a restaurant for dinner. The websites didn't load properly. Basic information was missing. Are you open? Where are you? Can I reserve a table? What's on the menu? And when he finally found a place, he was redirected to three different platforms just to book a table. That was the moment. So he started building Dineri.",
  },
  {
    year: "2024",
    title: "Building the foundation",
    desc: "We started building Dineri from the ground up. Working closely with different types of restaurants, from small bistros to busy beach clubs, we mapped out how they actually operate, what slows them down and what they're missing.",
  },
  {
    year: "2025",
    title: "Building and refining",
    desc: "With a clear picture of what restaurants needed, we got to work. Features were built, tested with real restaurant owners and refined based on their feedback. Then tested again. No feature shipped without a restaurant owner telling us it actually worked.",
  },
  {
    year: "2026",
    title: "Live",
    desc: "In 2026, Dineri goes live. One platform, built from the ground up for independent restaurants worldwide. No commission, no complexity, no compromises. The quiet infrastructure behind full tables.",
  },
];

const AboutPage = () => {
  return (
    <>
      <PageHeader
        number="05"
        label="About"
        headline={[
          { plain: "Built for the " },
          { lime: "people who " },
          { plain: "feed the world" },
        ]}
        description="Independent restaurants are the heart of every city, island and neighbourhood. Dineri gives them one platform to manage everything without the commission, the complexity or the compromises."
      />

      {/* Mission */}
      <section className="relative border-b border-white/5">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1fr_1.2fr] lg:gap-20 lg:px-8 lg:py-28">
          <div>
            <div className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[11px] text-lime">
              /OUR MISSION
            </div>
            <h2 className="font-inter-tight mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Independent restaurants deserve software as good as the chains.
            </h2>
          </div>
          <div className="space-y-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            <p>
              Every night, independent restaurants lose money to no-shows, missed reservations and
              delivery platforms taking a cut. They manage it all with a patchwork of tools that
              were never built for them
            </p>
            <p>
              Dineri was built to fix that. One platform. Zero commission. Built for the people who
              actually run the restaurant.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/5 bg-white/5 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-background p-8 text-center">
                <div className="font-inter-tight text-4xl font-bold tracking-tight text-lime sm:text-5xl">
                  {s.value}
                </div>
                <div className="font-jetbrains-mono uppercase tracking-[0.12rem] mt-3 text-[11px] text-muted-foreground">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="relative border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <div className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[11px] text-lime">
              /VALUES
            </div>
            <h2 className="font-inter-tight mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              How we build.
            </h2>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <div
                  key={v.title}
                  className="rounded-2xl border border-white/5 bg-surface-1 p-7 transition-colors hover:border-white/10"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-lime/30 bg-lime/10 text-lime">
                    <Icon className="h-5 w-5" strokeWidth={1.6} />
                  </div>
                  <h3 className="font-inter-tight mt-5 text-xl font-semibold tracking-tight">
                    {v.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="relative border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <div className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[11px] text-lime">
              /STORY
            </div>
            <h2 className="font-inter-tight mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Why Dineri exists
            </h2>
          </div>

          <ol className="relative mt-14 space-y-10 border-l border-white/10 pl-8">
            {timeline.map((t) => (
              <li key={t.year} className="relative">
                <span className="absolute -left-9.25 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-lime/40 bg-background">
                  <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                </span>
                <div className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[11px] text-lime">
                  {t.year}
                </div>
                <h3 className="font-inter-tight mt-2 text-xl font-semibold tracking-tight">
                  {t.title}
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {t.desc}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-surface-1 px-8 py-16 text-center lg:px-16">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-lime/15 blur-3xl"
            />
            <div className="relative">
              <div className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[11px] text-lime">
                /GET STARTED
              </div>
              <h2 className="font-inter-tight mx-auto mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Build the future of hospitality with us.
              </h2>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/sign-up">
                  <PillButton size="lg">Start your free month</PillButton>
                </Link>
                <Link href="/demo">
                  <PillButton size="lg" variant="outline">
                    Book a demo
                  </PillButton>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default AboutPage;
