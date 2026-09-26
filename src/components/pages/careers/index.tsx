import { PageHeader } from "@/components/shared/page-header";
import { ArrowRight, Globe, HeartHandshake, Rocket, Sparkles } from "lucide-react";
import { JobApplicationDialog } from "./_components/job-application-dialog";
import { PillButton } from "@/components/ui/ui-kit/PillButton";

const values = [
  {
    icon: Rocket,
    title: "Restaurants first",
    desc: "Every decision starts with one question: does this help a restaurant fill more tables or save more time? If not, it doesn't ship.",
  },
  {
    icon: HeartHandshake,
    title: "Build and learn",
    desc: "We move fast, test with real restaurants and improve based on what we see. Small bets, fast loops, real feedback.",
  },
  {
    icon: Globe,
    title: "Craft over scale",
    desc: "We'd rather ship one beautiful, well-considered feature then ten mediocre ones. Quality is not optional.",
  },
  {
    icon: Sparkles,
    title: "Ownership over hierarchy",
    desc: "Everyone owns their work. No waiting for permission, no passing the buck. If you see something that can be better, just fix it",
  },
];

const perks = [
  "Remote-friendly & work from anywhere",
  "Visit-a-restaurant budget (no, really)",
  "Learning budget",
  "Flexible hours",
  "Real ownership, build from day one",
  "Join early, and shape the product",
];

const openings = [
  {
    team: "Engineering",
    role: "Full-stack Developer",
    desc: "You build the product. From backend APIs to polished UI, you build the paltform that restaurants use every day.",
    location: "Remote",
    type: "Flexible hours",
    comp: "Freelance",
  },
  {
    team: "Content",
    role: "Content Creator",
    desc: "You tell our story. Short-form video, photography and copy that show restaurant what's possible with Dineri.",
    location: "Remote",
    type: "Flexible hours",
    comp: "Freelance",
  },
  {
    team: "Account Manager",
    role: "Sales",
    desc: "You bring new restaurants on board. You listen, demo and turn interesed restaurants into long-term partners.",
    location: "Remote",
    type: "Flexible hours",
    comp: "Native spanish speaker",
  },
];

const CareersPage = () => {
  return (
    <>
      <PageHeader
        number="07"
        label="Company · Careers"
        richClassName="max-w-4xl"
        headline={[{ plain: "Small team. " }, { lime: "Big " }, { plain: "mission." }]}
        description="We're a small, ambitious team based in Rotterdam building the quiet infrastructure behind full tables. Remote-frienly, moving fast and always looking for people who care about the work."
      />

      {/* Values */}
      <section className="relative border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="font-jetbrains-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            /01 - How we work
          </div>
          <h2 className="font-inter-tight mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Four principles. Every decision.
          </h2>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <article
                key={v.title}
                className="rounded-2xl border border-white/5 bg-surface-1 p-6 transition-all hover:-translate-y-0.5 hover:border-white/10 hover:bg-surface-2"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-lime/10 text-lime">
                  <v.icon className="h-4 w-4" />
                </div>
                <h3 className="font-inter-tight mt-5 text-lg font-semibold tracking-tight">
                  {v.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="relative border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <div className="font-jetbrains-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                /02 - Perks & benefits
              </div>
              <h2 className="font-inter-tight mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Small team. Real impaect.
              </h2>
              <p className="mt-4 max-w-md text-sm text-muted-foreground">
                We're a lean team building something we guinely believe in. Fast decisions, real
                ownership and a. product that makes a difference for independent restaurants every
                single day.
              </p>
            </div>
            <ul className="grid gap-px overflow-hidden rounded-2xl border border-white/5 bg-white/4 sm:grid-cols-2">
              {perks.map((p) => (
                <li key={p} className="flex items-start gap-3 bg-surface-1 px-5 py-4 text-sm">
                  <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-lime" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Open roles */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="font-jetbrains-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                /03 - Open roles
              </div>
              <h2 className="font-inter-tight mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                {openings.length} open positions.
              </h2>
            </div>
            <div className="flex items-center gap-2 font-jetbrains-mono text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime" />
              Updated weekly
            </div>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {openings.map((o) => (
              <JobApplicationDialog
                key={o.role}
                role={o.role}
                team={o.team}
                trigger={
                  <button
                    type="button"
                    className="group flex w-full flex-col rounded-2xl border border-white/5 bg-surface-1 p-6 text-left transition-all hover:-translate-y-0.5 hover:border-white/10 hover:bg-surface-2"
                  >
                    <span className="font-jetbrains-mono text-[11px] uppercase tracking-[0.12em] text-lime">
                      {o.team}
                    </span>
                    <h3 className="font-inter-tight mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
                      {o.role}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{o.desc}</p>
                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/10 bg-white/3 px-2.5 py-1 font-jetbrains-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        {o.type}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/3 px-2.5 py-1 font-jetbrains-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        {o.location}
                      </span>
                      <span className="rounded-full border border-lime/30 bg-lime/10 px-2.5 py-1 font-jetbrains-mono text-[10px] uppercase tracking-[0.14em] text-lime">
                        {o.comp}
                      </span>
                    </div>
                    <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors group-hover:text-lime">
                      View Job
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </button>
                }
              />
            ))}
          </div>

          {/* Don't see role */}
          <div className="mt-10 rounded-2xl border border-white/10 bg-linear-to-br from-surface-2 to-surface-1 p-8 sm:p-10">
            <div className="font-jetbrains-mono text-[10px] uppercase tracking-[0.12em] text-lime">
              Don&apos;t see your role
            </div>
            <h3 className="font-inter-tight mt-3 text-2xl font-semibold sm:text-3xl">
              Don't see your role?
            </h3>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              If you think you'de be a great fit for Dineri, we'd love to hear from you. Write us
              and tell us why.
            </p>
            <div className="mt-6">
              <a href="mailto:julian@dineri.app">
                <PillButton size="md">Mail to julian@dineri.app →</PillButton>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default CareersPage;
