"use client";
import { BetterAuthActionButton } from "@/app/(auth)/_components/social-login/better-auth-action-button";
import { Badge } from "@/components/ui/badge";
import { PillButton } from "@/components/ui/ui-kit/PillButton";
import { authClient } from "@/lib/auth/client";
import { useAuth } from "@/lib/auth/hooks/use-auth";
import { PLAN_TO_PRICE, PlanName, PLANS } from "@/lib/stripe/plans";
import { PLAN_TAGLINE } from "@/lib/stripe/plan-features";
import { cn } from "@/lib/utils";
import { Subscription } from "@better-auth/stripe";
import { Check, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Billing = "monthly" | "annual";

const currencyFormatter = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
});

const SubscriptionPage = ({ className }: { className?: string }) => {
  const { session } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [billing, setBilling] = useState<Billing>("annual");

  useEffect(() => {
    authClient.subscription.list().then((result) => {
      if (result.error) {
        setSubscriptions([]);
        toast.error("Failed to load subscriptions");
        return;
      }

      setSubscriptions(result.data);
    });
  }, [session]);

  const activeSubscription = subscriptions.find(
    (sub) => sub.status === "active" || sub.status === "trialing",
  );

  const activePlan = PLANS.find((plan) => plan.name === activeSubscription?.plan);

  async function handleBillingPortal() {
    const res = await authClient.subscription.billingPortal({
      returnUrl: window.location.href,
    });

    if (res.error == null) {
      window.location.href = res.data.url;
    }

    return res;
  }

  function handleCancelSubscription() {
    if (activeSubscription == null) {
      return Promise.resolve({ error: { message: "No active subscription" } });
    }
    return authClient.subscription.cancel({
      subscriptionId: activeSubscription.stripeSubscriptionId,
      returnUrl: window.location.href,
    });
  }

  function handleSubscriptionChange(plan: string) {
    return authClient.subscription.upgrade({
      plan,
      annual: billing === "annual" ? true : false,
      subscriptionId: activeSubscription?.stripeSubscriptionId,
      returnUrl: window.location.href,
      successUrl: window.location.href,
      cancelUrl: window.location.href,
    });
  }

  return (
    <>
      <section
        aria-labelledby="settings-panel-title"
        className={cn(
          "dash-card relative rounded-2xl border border-white/5 bg-surface-1 p-4 h-fit sm:p-6",
          className,
        )}
      >
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-white/5 mb-5 pb-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 id="settings-panel-title" className="font-inter-tight text-xl font-semibold">
                Subscription
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">Plan, billing and invoices</p>
            </div>
          </div>
        </header>
        <div>
          <section className="relative">
            {activeSubscription && activePlan && (
              <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-linear-to-br from-white/10 via-surface-1 to-surface-1 p-4">
                <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/15 blur-3xl" />

                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  {/* Left */}
                  <div className="space-y-4">
                    <div>
                      <div className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[9px] text-white">
                        Current Subscription
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <h2 className="font-inter-tight text-3xl font-bold capitalize">
                          {activeSubscription.plan}
                        </h2>

                        <Badge variant="secondary" className="capitalize">
                          {activeSubscription.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Pricing */}
                    {activeSubscription.priceId && (
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="border-white/20 bg-white/5 text-white">
                          {currencyFormatter.format(
                            PLAN_TO_PRICE[activeSubscription.plan as PlanName][
                              activeSubscription.billingInterval === "year" ? "yearly" : "monthly"
                            ],
                          )}

                          <span className="ml-1 text-muted-foreground">
                            /{activeSubscription.billingInterval === "year" ? "year" : "month"}
                          </span>
                        </Badge>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="text-sm flex gap-2 text-muted-foreground">
                      {activeSubscription.periodStart && (
                        <p>
                          Started on{" "}
                          <span className="text-foreground">
                            {activeSubscription.periodStart.toLocaleDateString()}
                          </span>
                        </p>
                      )}

                      {activeSubscription.periodEnd && (
                        <p>
                          {activeSubscription.cancelAtPeriodEnd ? "Cancels on " : "Renews on "}

                          <span className="text-foreground">
                            {activeSubscription.periodEnd.toLocaleDateString()}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right */}
                  <div className="flex flex-wrap gap-2">
                    <BetterAuthActionButton
                      variant="secondary"
                      action={handleBillingPortal}
                      className="min-w-40"
                    >
                      Billing Portal
                    </BetterAuthActionButton>
                  </div>
                </div>
              </div>
            )}
            <div className="mx-auto mt-6 max-w-7xl">
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
                          ? "bg-white text-primary-foreground"
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
                              : "bg-white/10 text-white",
                          )}
                        >
                          −17%
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cards */}
              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {PLANS.map((plan) => {
                  const isStarter = plan.name === "starter";

                  const price = billing === "annual" ? plan.yearlyPrice : plan.monthlyPrice;

                  const isCurrentPlan =
                    activeSubscription?.plan === plan.name &&
                    ((billing === "annual" && activeSubscription.billingInterval === "year") ||
                      (billing === "monthly" && activeSubscription.billingInterval === "month"));

                  return (
                    <article
                      key={plan.name}
                      className={cn(
                        "relative flex flex-col rounded-2xl border p-7 transition-all",
                        plan.name === "growth"
                          ? "border-white/40 bg-surface-1"
                          : "border-white/5 bg-surface-1/60 hover:border-white/10",
                      )}
                    >
                      {plan.name === "growth" && (
                        <div
                          aria-hidden
                          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/15 blur-3xl"
                        />
                      )}

                      <div className="relative flex h-full flex-col">
                        <div className="flex items-center justify-between">
                          <span className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[11px] text-muted-foreground">
                            {plan.name}
                          </span>

                          {plan.name === "growth" && (
                            <span className="font-jetbrains-mono uppercase tracking-[0.12rem] rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white">
                              Most popular
                            </span>
                          )}
                        </div>

                        <div className="mt-5 flex items-baseline gap-2">
                          <span className="font-inter-tight text-5xl font-bold tracking-tight">
                            {price === 0 ? "€0" : `€${price}`}
                          </span>

                          <span className="text-xs text-muted-foreground">
                            /{billing === "annual" ? "yr" : "mo"}
                          </span>
                        </div>

                        <p className="mt-3 text-sm text-muted-foreground">
                          {PLAN_TAGLINE[plan.name]}
                        </p>

                        <ul className="mt-7 space-y-3">
                          {plan.features?.map((feature) => (
                            <li key={feature} className="flex items-start gap-3 text-sm">
                              <Check
                                className={cn(
                                  "mt-0.5 h-4 w-4 shrink-0",
                                  plan.name === "growth" ? "text-white" : "text-foreground/70",
                                )}
                                strokeWidth={2.5}
                              />

                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-auto pt-8">
                          {isCurrentPlan ? (
                            activeSubscription.cancelAt ? (
                              <PillButton disabled variant="outline" className="w-full">
                                Scheduled to cancel on{" "}
                                {activeSubscription?.cancelAt?.toLocaleDateString()}
                              </PillButton>
                            ) : (
                              <BetterAuthActionButton
                                variant="destructive"
                                className="w-full"
                                action={handleCancelSubscription}
                              >
                                Cancel Subscription
                              </BetterAuthActionButton>
                            )
                          ) : (
                            <BetterAuthActionButton
                              action={() => handleSubscriptionChange(plan.name)}
                              className="w-full"
                              disabled={isStarter}
                            >
                              {activeSubscription == null
                                ? isStarter
                                  ? "Current Plan"
                                  : "Subscribe"
                                : activeSubscription.plan === plan.name
                                  ? billing === "annual"
                                    ? "Switch to yearly"
                                    : "Switch to monthly"
                                  : price > (activePlan?.monthlyPrice ?? 0)
                                    ? "Upgrade Plan"
                                    : "Change Plan"}
                            </BetterAuthActionButton>
                          )}
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
        </div>
      </section>
    </>
  );
};

export default SubscriptionPage;
