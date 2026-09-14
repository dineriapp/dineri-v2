import { PageHeader } from "@/components/shared/page-header";
import { ArrowRight, Globe, HeartHandshake, Rocket, Sparkles } from "lucide-react";
import { JobApplicationDialog } from "./_components/job-application-dialog";
import { PillButton } from "@/components/ui/ui-kit/PillButton";

const values = [
  {
    icon: Rocket,
    title: "Ship daily",
    desc: "We deploy to production every day. Small bets, fast loops, real customer feedback.",
  },
  {
    icon: HeartHandshake,
    title: "Restaurants first",
    desc: "Every decision is judged against one question: does it help a venue earn or save more?",
  },
  {
    icon: Globe,
    title: "Remote, async",
    desc: "Hubs in Milan and Lisbon, teammates across 9 countries. Default to writing.",
  },
  {
    icon: Sparkles,
    title: "Craft over scale",
    desc: "We'd rather ship one beautiful surface than ten mediocre ones. Taste is a requirement.",
  },
];

const perks = [
  "Equity in every offer",
  "Visit-a-restaurant budget (no, really)",
  "M2 / M3 MacBook Pro + 4K display",
  "30 days PTO + local public holidays",
  "Annual team offsite (last one: Sicily)",
  "Learning budget - €1,500/yr",
  "Health & dental in EU + UK",
  "Home-office stipend on day one",
];

const openings = [
  {
    team: "Marketing",
    role: "Growth Marketer",
    desc: "You own the Dineri brand. From social campaigns to content strategy, you're the reason restaurants choose us.",
    location: "Remote",
    type: "Part Time",
    comp: "Reflecting experience & skills",
  },
  {
    team: "Manager",
    role: "Customer Manager",
    desc: "You're the person our restaurants rely on. You guide them, support them and make sure they get the most out of Dineri.",
    location: "Remote",
    type: "Part Time",
    comp: "Reflecting experience & skills",
  },
  {
    team: "Engineering",
    role: "Full-stack Engineer",
    desc: "You ship the product. From backend APIs to polished UI, you build the surfaces restaurants use every day.",
    location: "Remote",
    type: "Part Time",
    comp: "Reflecting experience & skills",
  },
  {
    team: "Design",
    role: "Product Designer",
    desc: "You shape how Dineri feels. You design flows that restaurants love and guests find intuitive on their first visit.",
    location: "Remote",
    type: "Part Time",
    comp: "Reflecting experience & skills",
  },
  {
    team: "Content",
    role: "Content Creator",
    desc: "You tell our story. Short-form video, photography and copy that show restaurants what's possible with Dineri.",
    location: "Remote",
    type: "Part Time",
    comp: "Reflecting experience & skills",
  },
  {
    team: "Sales",
    role: "Sales Representative",
    desc: "You bring new restaurants on board. You listen, demo, and turn interested venues into long-term partners.",
    location: "Remote",
    type: "Part Time",
    comp: "Reflecting experience & skills",
  },
];

const CareersPage = () => {
  return (
    <>
      <PageHeader
        number="07"
        label="Company · Careers"
        richClassName="max-w-4xl"
        headline={[{ plain: "Build what " }, { lime: "restaurants " }, { plain: "rely on." }]}
        description="We're a small, opinionated team building the bio-link operating system for restaurants. Remote-first across the EU, hubs in Milan and Lisbon."
      />

      {/* Values */}
      <section className="relative border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="font-jetbrains-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            /01 - How we work
          </div>
          <h2 className="font-inter-tight mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Four operating principles. Hundreds of small decisions a week.
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
                The boring stuff, done right.
              </h2>
              <p className="mt-4 max-w-md text-sm text-muted-foreground">
                We believe great work needs great tools, time off and trust. Here&apos;s what every
                teammate gets - from day one.
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
              Pitch us anyway.
            </h3>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              If you&apos;d be a 10x hire for Dineri and we don&apos;t have a posting, write to us.
              We hire exceptional people ahead of need.
            </p>
            <div className="mt-6">
              <a href="mailto:careers@dineri.app">
                <PillButton size="md">Email careers@dineri.app →</PillButton>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default CareersPage;
