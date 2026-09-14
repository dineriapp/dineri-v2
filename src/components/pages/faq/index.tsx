import { PageHeader } from "@/components/shared/page-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PillButton } from "@/components/ui/ui-kit/PillButton";
import Link from "next/link";

const categories = [
  {
    key: "getting-started",
    label: "Getting started",
    items: [
      {
        q: "How long does it take to set up Dineri?",
        a: "Most venues are live in a single sitting. Create your venue, build your menu, choose a theme, and your link is ready to share - no website, developer or design work required.",
      },
      {
        q: "Do I need a credit card to start?",
        a: "No. The Starter plan is free forever and requires no payment details. You only add a card if you choose to upgrade to Growth or Scale.",
      },
      {
        q: "How do I add my menu?",
        a: "You build it in the dashboard. Create your categories, then add each dish with a description, price, photo, allergen tags and any add-ons. Everything you change appears on your live page straight away.",
      },
    ],
  },
  {
    key: "billing",
    label: "Plans & billing",
    items: [
      {
        q: "Which plans are available?",
        a: "Three. Starter is free forever and covers a single venue. Growth adds reservations, online orders, QR codes and extended analytics. Scale supports up to five venues. The full comparison is on our pricing page.",
      },
      {
        q: "How do payments work?",
        a: "Subscriptions are billed securely through Stripe, which accepts all major credit and debit cards. There is no setup fee - the price you see is the price you pay.",
      },
      {
        q: "Can I switch between monthly and annual billing?",
        a: "Yes, at any time from your billing settings. Annual billing is discounted; the exact saving for each plan is shown on the pricing page.",
      },
    ],
  },
  {
    key: "reservations",
    label: "Reservations & orders",
    items: [
      {
        q: "Do you charge commission on bookings or orders?",
        a: "Never. Dineri takes no commission on reservations or orders. You pay a flat monthly fee for your venue - never a percentage, and never per cover.",
      },
      {
        q: "Can I take deposits to reduce no-shows?",
        a: "Yes. Connect your own Stripe account and require a deposit or full prepayment when a guest books. Funds settle directly to your account - Dineri never holds your money.",
      },
      {
        q: "How do I manage bookings day to day?",
        a: "Your dashboard includes a service timeline, table assignment and status tracking, with confirmation emails sent to guests automatically.",
      },
    ],
  },
  {
    key: "menu",
    label: "Menu & QR codes",
    items: [
      {
        q: "Which languages is Dineri available in?",
        a: "The Dineri interface is available in six languages - English, German, French, Dutch, Italian and Spanish. Your menu is published in the languages you enter it in; automatic menu translation is on our roadmap.",
      },
      {
        q: "Can I create QR codes for my tables?",
        a: "Yes. Generate QR codes that open your menu directly, download them as PNG for print or SVG for any size, and see how often they are scanned in your analytics.",
      },
      {
        q: "How do I handle allergens, add-ons and sold-out dishes?",
        a: "Every dish supports allergen and dietary tags, add-ons and variants. Mark an item unavailable and it updates on your live menu immediately.",
      },
    ],
  },
  {
    key: "data",
    label: "Data & privacy",
    items: [
      {
        q: "Is Dineri GDPR compliant?",
        a: "Yes. We collect only the guest data a booking or order requires, and a Data Processing Agreement is available to every customer on request.",
      },
      {
        q: "Who owns my menu and guest data?",
        a: "You do, always. Your content and your guest records remain yours, and we never sell them or share them with third parties for marketing.",
      },
      {
        q: "Can I delete my account and data?",
        a: "Yes. Contact our support team and we will permanently delete your account and all associated data.",
      },
    ],
  },
];

const FaqPage = () => {
  return (
    <>
      <PageHeader
        number="06"
        label="Help · FAQ"
        headline={[{ plain: "Questions, " }, { lime: "answered." }]}
        description="Answers to the questions restaurant owners ask most often before getting started. If we haven't covered what you need, our team is happy to help."
      />
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[280px_1fr]">
            {/* Side rail - categories */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-white/5 bg-surface-1 p-5">
                <div className="flex items-center justify-between">
                  <div className="font-jetbrains-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Categories
                  </div>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 font-jetbrains-mono text-[10px] text-muted-foreground tabular-nums">
                    {categories.reduce((s, c) => s + c.items.length, 0)}
                  </span>
                </div>
                <ul className="mt-3 space-y-1">
                  {categories.map((c) => (
                    <li key={c.key}>
                      <a
                        href={`#${c.key}`}
                        className="group flex items-center justify-between rounded-lg px-2.5 py-2 text-sm text-foreground/75 transition hover:bg-white/5 hover:text-foreground"
                      >
                        <span className="flex items-center gap-2">
                          <span className="h-1 w-1 rounded-full bg-lime/50 transition group-hover:bg-lime" />
                          {c.label}
                        </span>
                        <span className="font-jetbrains-mono text-[10px] text-muted-foreground tabular-nums">
                          {c.items.length.toString().padStart(2, "0")}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 rounded-xl border border-white/5 bg-background p-3">
                  <div className="font-jetbrains-mono text-[10px] uppercase tracking-[0.18em] text-lime">
                    Reading time
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    ~ 4 min · {categories.reduce((s, c) => s + c.items.length, 0)} answers
                  </div>
                </div>
              </div>
            </aside>

            {/* Body */}
            <div className="space-y-12">
              {categories.map((c) => (
                <section key={c.key} id={c.key} className="scroll-mt-24">
                  <div className="flex items-baseline gap-3">
                    <span className="font-jetbrains-mono text-[11px] uppercase tracking-[0.18em] text-lime">
                      §
                    </span>
                    <h2 className="font-inter-tight text-2xl font-semibold tracking-tight sm:text-3xl">
                      {c.label}
                    </h2>
                  </div>

                  <Accordion
                    type="single"
                    collapsible
                    className="mt-5 rounded-2xl border border-white/5 bg-surface-1/50"
                  >
                    {c.items.map((item, idx) => (
                      <AccordionItem
                        key={item.q}
                        value={`${c.key}-${idx}`}
                        className="border-white/5 px-5 last:border-b-0"
                      >
                        <AccordionTrigger className="text-left text-[15px] font-medium hover:no-underline">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-[15px] leading-relaxed text-foreground/75">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>
              ))}

              {/* Still have questions */}
              <div className="rounded-2xl border border-white/10 bg-linear-to-br from-surface-2 to-surface-1 p-8 sm:p-10">
                <div className="font-jetbrains-mono text-[10px] uppercase tracking-[0.18em] text-lime">
                  Still stuck
                </div>
                <h3 className="font-inter-tight mt-3 text-2xl font-semibold sm:text-3xl">
                  Talk to a human.
                </h3>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  Our support team replies in under 2 hours during business days, in 7 languages.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link href="/help">
                    <PillButton size="md">Open Help Center →</PillButton>
                  </Link>
                  <a
                    href="mailto:info@dineri.app"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    info@dineri.app
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default FaqPage;
