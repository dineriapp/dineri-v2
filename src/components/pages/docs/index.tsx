import { PageHeader } from "@/components/shared/page-header";
import { ArrowRight, BookOpen, Code2, Rocket, Shield } from "lucide-react";

const sections = [
  {
    icon: Rocket,
    title: "Getting started",
    desc: "Create your venue, build your menu, and publish your link.",
    items: [
      "Create an account",
      "Build your menu (categories, dishes, prices)",
      "Publish your link",
      "Add your QR codes",
    ],
  },
  {
    icon: BookOpen,
    title: "Guides",
    desc: "Hands-on tutorials for every Dineri module - menu, reservations, reviews, analytics.",
    items: [
      "Smart Menu basics",
      "Setting up reservations",
      "Per-table QR strategy",
      "Reading the funnel",
    ],
  },
  {
    icon: Code2,
    title: "API & webhooks",
    desc: "Programmatic access to menus, bookings and analytics. REST + webhooks.",
    items: ["Authentication", "Menus endpoint", "Bookings webhook", "Rate limits"],
  },
  {
    icon: Shield,
    title: "Security & compliance",
    desc: "How we handle data, GDPR, DPAs, and incident response.",
    items: ["GDPR overview", "Data processing addendum", "Subprocessors", "Status & uptime"],
  },
];

const DocsPage = () => {
  return (
    <>
      <PageHeader
        number="05"
        label="Documentation"
        headline={[
          { plain: "Build, ship, " },
          { lime: "and scale " },
          { plain: "with confidence." },
        ]}
        richClassName="max-w-4xl"
        description="Guides and API reference for every Dineri module. Everything you need to launch - and everything you'll need to grow."
      />
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          <div className="grid gap-3 sm:grid-cols-2">
            {sections.map((s) => (
              <article
                key={s.title}
                className="group rounded-2xl border border-white/5 bg-surface-1 p-7 transition-all hover:-translate-y-0.5 hover:border-white/10 hover:bg-surface-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-lime/10 text-lime">
                    <s.icon className="h-4 w-4" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-lime" />
                </div>
                <h2 className="font-inter-tight mt-6 text-xl font-semibold tracking-tight">
                  {s.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                <ul className="mt-5 space-y-2">
                  {s.items.map((i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                      <span className="font-jetbrains-mono text-[10px] text-muted-foreground">
                        ›
                      </span>
                      {i}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default DocsPage;
