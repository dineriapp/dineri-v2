"use client";
import { PageHeader } from "@/components/shared/page-header";
import { PillButton } from "@/components/ui/ui-kit/PillButton";
import { PLAN_LABEL } from "@/lib/stripe/checkers";
import {
  PLAN_COMPARISON,
  PLAN_CTA,
  PLAN_PERIOD,
  PLAN_TAGLINE,
  planHeadlineFeatures,
} from "@/lib/stripe/plan-features";
import { PLAN_TO_PRICE } from "@/lib/stripe/plans";
import { cn } from "@/lib/utils";
import { Check, Minus } from "lucide-react";
import Link from "next/link";
import { Fragment, useState } from "react";

type Billing = "monthly" | "annual";

const tiers = (["starter", "growth", "scale"] as const).map((plan) => {
  const { monthly, yearly } = PLAN_TO_PRICE[plan];
  const annual = yearly > 0 ? yearly / 12 : 0;

  return {
    plan,
    name: PLAN_LABEL[plan],
    monthly,
    annual,
    yearly,
    period: PLAN_PERIOD[plan],
    desc: PLAN_TAGLINE[plan],
    highlight: plan === "growth",
    cta: PLAN_CTA[plan],
    features: planHeadlineFeatures(plan),
    savingPercent: monthly > 0 ? Math.round((1 - annual / monthly) * 100) : 0,
  };
});

const MAX_ANNUAL_SAVING = Math.max(...tiers.map((t) => t.savingPercent));

const money = (value: number) => (Number.isInteger(value) ? `€${value}` : `€${value.toFixed(2)}`);

const compareSections = PLAN_COMPARISON;

const faqs = [
  {
    q: "Do you charge per reservation or order?",
    a: "Never. Dineri is a flat subscription. 100% of your revenue stays with you.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes - upgrade or downgrade anytime. Annual plans are pro-rated.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes. Starter is free forever and includes one venue with the smart menu, QR codes and 7 days of analytics.",
  },
  {
    q: "Do you offer discounts for groups?",
    a: "We offer custom pricing for chains and groups starting at 5 venues. Contact sales.",
  },
];

const Cell = ({ value }: { value: boolean | string }) => {
  if (value === true) return <Check className="mx-auto h-4 w-4 text-lime" strokeWidth={2.5} />;
  if (value === false) return <Minus className="mx-auto h-4 w-4 text-muted-foreground/50" />;
  return <span className="text-sm text-foreground/90">{value}</span>;
};

const PricingPage = () => {
  const [billing, setBilling] = useState<Billing>("annual");

  return (
    <>
      <PageHeader
        number="04"
        label="Pricing"
        headline={[{ plain: "Less than " }, { lime: "one empty table " }, { plain: "per month" }]}
        richClassName="max-w-4xl"
        description="Before you decide, see what you're already losing. Our free ROI calculator shows exactly how much no-shows, missed reservations and commission fees are costing your restaurant every month."
      />

      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          {/* Billing toggle */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-surface-1 p-1">
              {(["monthly", "annual"] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => setBilling(b)}
                  className={cn(
                    "relative h-9 rounded-full px-5 text-sm font-medium capitalize transition-all",
                    billing === b
                      ? "bg-lime text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {b}
                  {b === "annual" && (
                    <span
                      className={cn(
                        "ml-2 rounded-full px-1.5 py-0.5 font-jetbrains-mono text-[10px]",
                        billing === "annual"
                          ? "bg-primary-foreground/15 text-primary-foreground"
                          : "bg-lime/10 text-lime",
                      )}
                    >
                      −{MAX_ANNUAL_SAVING}%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Cards */}
          <div className="mt-8 grid gap-4 sm:mt-12 lg:grid-cols-3">
            {tiers.map((t) => {
              const price =
                t.monthly === 0 ? "€0" : money(billing === "annual" ? t.annual : t.monthly);
              return (
                <article
                  key={t.name}
                  className={cn(
                    "relative flex flex-col rounded-2xl border p-5 transition-all sm:p-7",
                    t.highlight
                      ? "border-lime/40 bg-surface-1"
                      : "border-white/5 bg-surface-1/60 hover:border-white/10",
                  )}
                >
                  {t.highlight && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-lime/15 blur-3xl"
                    />
                  )}
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <span className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[11px] text-muted-foreground">
                        {t.name}
                      </span>
                      {t.highlight && (
                        <span className="font-jetbrains-mono uppercase tracking-[0.12rem] rounded-full bg-lime/10 px-2 py-0.5 text-[10px] text-lime">
                          Most popular
                        </span>
                      )}
                    </div>

                    <div className="mt-5 flex items-baseline gap-2">
                      <span className="font-inter-tight text-5xl font-bold tracking-tight">
                        {price}
                      </span>
                      <span className="text-xs text-muted-foreground">{t.period}</span>
                    </div>
                    {billing === "annual" && !!t.monthly && t.monthly > 0 && (
                      <div className="mt-1 font-jetbrains-mono text-[11px] text-muted-foreground">
                        billed annually · {money(t.yearly)}/yr · save {t.savingPercent}%
                      </div>
                    )}
                    <p className="mt-3 text-sm text-muted-foreground">{t.desc}</p>

                    <ul className="mt-7 space-y-3">
                      {t.features.map((f) => (
                        <li key={f} className="flex items-start gap-3 text-sm">
                          <Check
                            className={cn(
                              "mt-0.5 h-4 w-4 shrink-0",
                              t.highlight ? "text-lime" : "text-foreground/70",
                            )}
                            strokeWidth={2.5}
                          />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-8">
                      <Link href="/sign-up" className="block">
                        <PillButton
                          size="lg"
                          variant={t.highlight ? "primary" : "outline"}
                          className="w-full"
                        >
                          {t.cta}
                        </PillButton>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <p className="mt-8 text-center font-jetbrains-mono uppercase text-[11px] text-muted-foreground">
            All plans · No credit card · GDPR · Cancel anytime
          </p>
        </div>
      </section>

      {/* Comparison table */}
      <section className="relative border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <div className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[11px] text-lime">
              /COMPARE PLANS
            </div>
            <h2 className="font-inter-tight mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Every feature, side by side.
            </h2>
          </div>

          <div className="mt-10 overflow-x-auto rounded-2xl border border-white/5 bg-surface-1">
            <table className="w-full min-w-160 text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="font-jetbrains-mono uppercase tracking-[0.12rem] px-4 py-5 text-[11px] font-normal text-muted-foreground sm:px-6">
                    Feature
                  </th>
                  {tiers.map((t) => (
                    <th
                      key={t.name}
                      className={cn(
                        "px-6 py-5 text-center text-sm font-semibold",
                        t.highlight && "text-lime",
                      )}
                    >
                      {t.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareSections.map((sec) => (
                  <Fragment key={sec.section}>
                    <tr className="border-b border-white/5 bg-white/2">
                      <td
                        colSpan={4}
                        className="font-jetbrains-mono uppercase tracking-[0.12rem] px-6 py-3 text-[11px] text-lime"
                      >
                        {sec.section}
                      </td>
                    </tr>
                    {sec.rows.map((row) => (
                      <tr key={row.label} className="border-b border-white/5 last:border-0">
                        <td className="px-4 py-4 text-sm text-foreground/90 sm:px-6">
                          {row.label}
                        </td>
                        {row.values.map((v, i) => (
                          <td
                            key={i}
                            className={cn(
                              "px-6 py-4 text-center",
                              tiers[i].highlight && "bg-lime/3",
                            )}
                          >
                            <Cell value={v} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr]">
            <div>
              <div className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[11px] text-lime">
                /FAQ
              </div>
              <h2 className="font-inter-tight mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Pricing questions, answered.
              </h2>
              <p className="mt-4 max-w-sm text-sm text-muted-foreground">
                Still curious? Talk to our team - we&apos;ll match you with the right plan.
              </p>
              <Link href="/demo" className="mt-6 inline-block">
                <PillButton variant="outline">Talk to sales</PillButton>
              </Link>
            </div>
            <dl className="space-y-3">
              {faqs.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-2xl border border-white/5 bg-surface-1 p-6 open:border-white/10"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-6 list-none">
                    <dt className="font-inter-tight text-base font-semibold tracking-tight">
                      {f.q}
                    </dt>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <dd className="mt-4 text-sm leading-relaxed text-muted-foreground">{f.a}</dd>
                </details>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </>
  );
};

export default PricingPage;
