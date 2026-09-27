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
        a: "Most restaurants are live within 10 minutes. Add your details, upload your menu and your Dineri page is ready for guests. No developer needed, no waiting around.",
      },
      {
        q: "Do I need a credit card to start?",
        a: "No. Your first month is completely free and no credit card is required. When your trial ends, you can pay with a credit card or a wide range of local payment methods. All payments are processed securely by Stripe..",
      },
      {
        q: "Do I need technical skills to use Dineri?",
        a: "Not at all. Dineri was built together with restaurant owners and their teams, so everything is designed to be simple and self-explanatory. No technical knowledge needed. Like anything new, it takes a moment to get familiar. But most restaurant owners are live within 10 minutes. If you can use Instagram, you can use Dineri.",
      },
    ],
  },
  {
    key: "billing",
    label: "Plans & billing",
    items: [
      {
        q: "What does Dineri cost?",
        a: "Dineri starts at €129 per month. Your first month is completely free, no credit card required. And if it's not the right fit, just cancel. No questions asked. For a full breakdown of what's included, visit our pricing page.",
      },
      {
        q: "Can I switch between monthly and annual?",
        a: "Switching from monthly to annual is easy and you'll always get 2 months free when you do. Switching from annual back to monthly is not possible mid-term. We understand that circumstances can change, so if you find yourself in that situation, reach out to us via the help desk and we'll see what we can do.",
      },
      {
        q: "Is there a setup fee?",
        a: "No setup fee. Once you become a Dineri customer through a demo request and an onboarding call with us, we set everything up for you completely free. Your entire page is built around your restaurant. Your colors, your menu, your details. Ready to use from day one.",
      },
    ],
  },
  {
    key: "reservations",
    label: "Reservations",
    items: [
      {
        q: "Do you charge commission on bookings?",
        a: "Never. Dineri charges a flat monthly or annual subscription. Every reservation, every order, every euro stays with you. We don't take a cut. Ever.",
      },
      {
        q: "Can I take deposits to prevent no-shows?",
        a: "Yes. Dineri offers built-in no-show protection. You can choose to require a deposit at the time of booking and credited to the guest's bill when they arrive. If a guest doesn't show up, the deposit is automatically charged. No manual work, no awkward conversations. Guests show up or you get paid.",
      },
      {
        q: "Does it integrate with my POS?",
        a: "POS integrations are currently in development. Once live, they will be included in your existing plan at no extra cost. Want to be the first to know when they go live? Get in touch and we'll keep you updated",
      },
    ],
  },
  {
    key: "menu",
    label: "Orders",
    items: [
      {
        q: "Do you charge commission on orders?",
        a: "Never. Dineri charges a flat monthly or annual subscription. Every order, every euro goes straight to your bank account. No commission, no hidden fees, no middleman. Ever.",
      },
      {
        q: "Can I pause or disable ordering temporarily?",
        a: "Yes. Pause or disable ordering anytime directly from your dashboard. Whether it's a closing day, a holiday or the kitchen just needs a moment to catch up. One click to pause, one click to resume.",
      },
      {
        q: "How do I receive and manage incoming orders?",
        a: "Every order comes straight into your Dineri dashboard. You receive an instant notification, see the full order details and can manage everything from one place. No third-party platform, no extra app needed.",
      },
    ],
  },
  {
    key: "data",
    label: "Data & privacy",
    items: [
      {
        q: "Is Dineri GDPR compliant?",
        a: "Yes. Dineri is fully GDPR compliant. Your data and your customers' data is stored securely within the European Union. We never sell or share data with third parties. For full details, see our privacy policy.",
      },
      {
        q: "Who owns my data and my customers data?",
        a: "You do. Always. Your menu, your reservations, your customer data. It's yours. Dineri processes it on your behalf but never owns it, sells it or uses it for any other purpose. You can export or delete your data at any time. When you cancel your account, we delete everything within 30 days.",
      },
      {
        q: "Can I delete my account?",
        a: "Yes. To delete your account, please reach out to our helpdesk. All your data, including your menu, reservations and customer data, will be permanently deleted within 30 days.",
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
        headline={[{ plain: "Good " }, { lime: "question" }]}
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
                  Support
                </div>
                <h3 className="font-inter-tight mt-3 text-2xl font-semibold sm:text-3xl">
                  Still have questions?
                </h3>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  Our support team replies within 1 business day. Reach out via the helpdesk and
                  we'll get back to you as soon as possible.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link href="/help">
                    <PillButton size="md">Help Center →</PillButton>
                  </Link>
                  <a
                    href="mailto:info@dineri.app"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  ></a>
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
