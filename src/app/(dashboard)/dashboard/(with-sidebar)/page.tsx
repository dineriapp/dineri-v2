"use client";

import { useAuth } from "@/lib/auth/hooks/use-auth";
import {
  getAnalyticsRetentionDays,
  hasFeature,
  meetsPlan,
  PLAN_LABEL,
} from "@/lib/stripe/checkers";
import { PlanName } from "@/lib/stripe/plans";
import { useSelectedRestaurant } from "@/stores/restaurant-store";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  Activity,
  CalendarCheck,
  CalendarPlus,
  Clock,
  Eye,
  Globe2,
  Hash,
  LayoutDashboard,
  Package,
  QrCode,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  UsersRound,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { timeAgo } from "../_components";
import TopBar from "../_components/top-bar";
import { getDashboardOverview, OverviewRange } from "./actions";
import type { ReservationGroupId } from "./reservations/_components/dashboard/actions";
import {
  ActivityFeed,
  CardHeading,
  DeltaBadge,
  LockedPanel,
  OverviewCard,
  PlanCard,
  QuickLink,
  RangeSwitcher,
  RatingCardReal,
  SectionHeading,
  SharePageCard,
  SnapshotTile,
  StatusBars,
  TopLinksCard,
  TrendCard,
} from "./_components/overview/widgets";
import { fmtMoney } from "./orders/_components/utils";

const RANGE_OPTIONS: { value: OverviewRange; label: string; days: number; minPlan: PlanName }[] = [
  { value: "7D", label: "7D", days: 7, minPlan: "starter" },
  { value: "30D", label: "30D", days: 30, minPlan: "growth" },
  { value: "90D", label: "90D", days: 90, minPlan: "scale" },
];

const RANGE_WORD: Record<OverviewRange, string> = {
  "7D": "week",
  "30D": "month",
  "90D": "quarter",
};

const ORDER_STATUS_META: { key: string; label: string; color: string }[] = [
  { key: "new", label: "New", color: "hsl(var(--info))" },
  { key: "confirmed", label: "Confirmed", color: "hsl(var(--warning))" },
  { key: "preparing", label: "Preparing", color: "hsl(var(--warning))" },
  { key: "ready", label: "Ready", color: "#ffffff" },
  { key: "delivered", label: "Delivered", color: "hsl(var(--success))" },
  { key: "cancelled", label: "Cancelled", color: "hsl(var(--danger))" },
];

const RESERVATION_GROUP_META: { key: ReservationGroupId; label: string; color: string }[] = [
  { key: "awaiting", label: "Awaiting", color: "hsl(var(--warning))" },
  { key: "confirmed", label: "Confirmed", color: "hsl(var(--info))" },
  { key: "seated", label: "Seated", color: "hsl(var(--success))" },
  { key: "completed", label: "Completed", color: "#ffffff" },
  { key: "cancelled", label: "Cancelled", color: "hsl(var(--muted-foreground))" },
  { key: "no_show", label: "No-shows", color: "hsl(var(--danger))" },
];

const ORDERS_BLURB = "Take pickup and delivery orders from your page, with zero commission.";
const RESERVATIONS_BLURB =
  "Take table bookings from your page, manage the floor, and track covers per service.";

export default function Page() {
  const selectedRestaurant = useSelectedRestaurant();
  const { user } = useAuth();
  const plan = (user?.subscription?.plan as PlanName) ?? "starter";
  const maxRetentionDays = getAnalyticsRetentionDays(plan);
  const reservationsEnabled = hasFeature(plan, "reservations");
  const ordersEnabled = hasFeature(plan, "orderSystem");
  const currency = selectedRestaurant?.stripe?.currency ?? undefined;

  const availableRanges = useMemo(
    () => RANGE_OPTIONS.filter((r) => meetsPlan(plan, r.minPlan) && r.days <= maxRetentionDays),
    [plan, maxRetentionDays],
  );

  const viewableDays = availableRanges[availableRanges.length - 1]?.days ?? 7;

  const [range, setRange] = useState<OverviewRange>("7D");
  const effectiveRange = availableRanges.some((r) => r.value === range)
    ? range
    : (availableRanges[availableRanges.length - 1]?.value ?? "7D");

  const { data, isPending, isFetching, dataUpdatedAt, refetch } = useQuery({
    queryKey: ["dashboard-overview", effectiveRange],
    queryFn: async () => {
      const result = await getDashboardOverview(effectiveRange);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const firstName = user?.name?.split(" ")[0];
  const greeting = firstName ? `Welcome Back, ${firstName}` : "Welcome Back";
  const today = new Date();
  const dateLabel = today
    .toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase()
    .replace(/,/g, " ·");

  const orderStatusItems = ORDER_STATUS_META.map((s) => ({
    label: s.label,
    value: data?.orders.statusCounts?.[s.key as keyof typeof data.orders.statusCounts] ?? 0,
    color: s.color,
  }));

  const reservationStatusItems = RESERVATION_GROUP_META.map((s) => ({
    label: s.label,
    value: data?.reservations.groupCounts?.[s.key] ?? 0,
    color: s.color,
  }));

  return (
    <>
      <TopBar page="Dashboard" />
      <div
        className={`p-4 sm:p-6 ${isFetching && !isPending ? "opacity-90" : ""} transition-opacity`}
      >
        {/* Hero */}
        <div className="dash-card relative animate-fade-in overflow-hidden rounded-2xl border border-white/5 bg-surface-1">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent" />
          <div className="relative flex flex-col gap-5 p-5 lg:flex-row lg:items-start lg:justify-between lg:p-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-surface-2 text-white">
                  <LayoutDashboard className="h-4.5 w-4.5" />
                </div>
                <div className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
                  {dateLabel}
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white">
                  <Sparkles className="h-2.5 w-2.5" /> {PLAN_LABEL[plan]}
                </span>
              </div>
              <h1 className="mt-3 font-inter-tight text-3xl font-bold tracking-tight sm:text-4xl">
                {greeting}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Here&apos;s how <span className="text-foreground">{selectedRestaurant.name}</span>{" "}
                is performing this {RANGE_WORD[effectiveRange]}.
              </p>

              <div className="font-jetbrains-mono uppercase mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-success" />
                  Last sync · {dataUpdatedAt ? timeAgo(new Date(dataUpdatedAt).toISOString()) : "—"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  {viewableDays}d analytics history
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="h-3 w-3" />
                  {isPending ? "…" : data!.visitors.total.toLocaleString()} visitors ·{" "}
                  {effectiveRange}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <RangeSwitcher
                options={RANGE_OPTIONS}
                value={effectiveRange}
                onChange={setRange}
                plan={plan}
              />
              <button
                onClick={() => refetch()}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-background px-3 text-xs hover:border-white/20"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Today */}
        <div className="mt-6">
          <SectionHeading eyebrow="Today" title="Live Snapshot" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {ordersEnabled ? (
              <>
                <SnapshotTile
                  icon={ShoppingBag}
                  label="Orders today"
                  value={isPending ? "—" : data!.today.ordersCount.toLocaleString()}
                />
                <SnapshotTile
                  icon={Wallet}
                  label="Revenue today"
                  value={isPending ? "—" : fmtMoney(data!.today.ordersRevenue, currency)}
                  tone="white"
                />
                <SnapshotTile
                  icon={Package}
                  label="Pending orders"
                  value={isPending ? "—" : data!.today.ordersPending.toLocaleString()}
                  tone={!isPending && data!.today.ordersPending > 0 ? "amber" : "default"}
                  pulse={!isPending && data!.today.ordersPending > 0}
                />
              </>
            ) : (
              <>
                <LockedPanel feature="Ordering" requiredPlan="growth" variant="tile">
                  <SnapshotTile icon={ShoppingBag} label="Orders today" value="—" />
                </LockedPanel>
                <LockedPanel feature="Revenue" requiredPlan="growth" variant="tile">
                  <SnapshotTile icon={Wallet} label="Revenue today" value="—" tone="white" />
                </LockedPanel>
                <LockedPanel feature="Order queue" requiredPlan="growth" variant="tile">
                  <SnapshotTile icon={Package} label="Pending orders" value="—" tone="amber" />
                </LockedPanel>
              </>
            )}

            {reservationsEnabled ? (
              <SnapshotTile
                icon={CalendarCheck}
                label="Awaiting confirmation"
                value={isPending ? "—" : data!.today.reservationsAwaiting.toLocaleString()}
                tone={!isPending && data!.today.reservationsAwaiting > 0 ? "amber" : "default"}
                pulse={!isPending && data!.today.reservationsAwaiting > 0}
              />
            ) : (
              <LockedPanel feature="Reservations" requiredPlan="growth" variant="tile">
                <SnapshotTile
                  icon={CalendarCheck}
                  label="Awaiting confirmation"
                  value="—"
                  tone="amber"
                />
              </LockedPanel>
            )}
          </div>
        </div>

        {/* Trends */}
        <div className="mt-6">
          <SectionHeading
            eyebrow="Trends"
            title={`Performance · Last ${effectiveRange}`}
            action={
              <span className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
                vs. previous {effectiveRange}
              </span>
            }
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
            <TrendCard
              icon={Eye}
              label={`Visitors · ${effectiveRange}`}
              value={isPending ? "—" : data!.visitors.total.toLocaleString()}
              deltaPct={data?.visitors.deltaPct ?? null}
              sparkline={data?.visitors.sparkline ?? []}
              hint={
                isPending ? undefined : `${data!.visitors.uniqueVisitors.toLocaleString()} unique`
              }
              tone="white"
            />
            <TrendCard
              icon={UtensilsCrossed}
              label="Menu views"
              value={isPending ? "—" : data!.menuViews.total.toLocaleString()}
              deltaPct={data?.menuViews.deltaPct ?? null}
              sparkline={data?.menuViews.sparkline ?? []}
            />

            {ordersEnabled ? (
              <TrendCard
                icon={TrendingUp}
                label="Revenue"
                value={isPending ? "—" : fmtMoney(data!.orders.revenue, currency)}
                deltaPct={data?.orders.revenueDeltaPct ?? null}
                sparkline={data?.orders.sparkline ?? []}
                hint={isPending ? undefined : `${data!.orders.total.toLocaleString()} orders`}
              />
            ) : (
              <LockedPanel feature="Revenue tracking" requiredPlan="growth" blurb={ORDERS_BLURB}>
                <TrendCard
                  icon={TrendingUp}
                  label="Revenue"
                  value="—"
                  deltaPct={null}
                  sparkline={[]}
                />
              </LockedPanel>
            )}

            {reservationsEnabled ? (
              <OverviewCard className="relative overflow-hidden p-5">
                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-info/8 blur-3xl" />
                <div className="relative flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-background">
                      <UsersRound className="h-3.5 w-3.5" />
                    </span>
                    Upcoming covers
                  </span>
                  <DeltaBadge pct={data?.reservations.newBookingsDeltaPct ?? null} />
                </div>
                <div className="relative mt-3 font-inter-tight text-3xl font-bold tracking-tight tabular-nums">
                  {isPending ? "—" : data!.reservations.covers.toLocaleString()}
                </div>
                <div className="relative mt-1 text-[11px] text-muted-foreground">
                  {isPending
                    ? ""
                    : `${data!.reservations.total.toLocaleString()} reservations · next ${effectiveRange}`}
                </div>
                <div className="font-jetbrains-mono relative mt-3 h-10 text-[10px] uppercase tracking-[0.12rem] text-muted-foreground">
                  new bookings trend
                </div>
              </OverviewCard>
            ) : (
              <LockedPanel feature="Reservations" requiredPlan="growth" blurb={RESERVATIONS_BLURB}>
                <TrendCard
                  icon={UsersRound}
                  label="Upcoming covers"
                  value="—"
                  deltaPct={null}
                  sparkline={[]}
                />
              </LockedPanel>
            )}
          </div>
        </div>

        {/* Audience */}
        <div className="mt-6">
          <SectionHeading eyebrow="Audience" title="Where your traffic comes from" />
          <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-3">
            <OverviewCard className="xl:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardHeading eyebrow="Traffic" title="Sources & Countries" />
                <span className="inline-flex items-center gap-1.5 font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-white">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                  LIVE
                </span>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <div className="font-jetbrains-mono uppercase tracking-[0.12rem] mb-3 text-[10px] text-muted-foreground">
                    Top sources
                  </div>
                  {!isPending && data!.visitors.trafficSources.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No traffic data for this range yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {(data?.visitors.trafficSources ?? []).slice(0, 5).map(([source, count]) => {
                        const total =
                          data!.visitors.trafficSources.reduce((s, [, c]) => s + c, 0) || 1;
                        const pct = Math.round((count / total) * 100);
                        return (
                          <div key={source}>
                            <div className="flex items-center justify-between text-[12px]">
                              <span className="capitalize">{source}</span>
                              <span className="font-jetbrains-mono text-[10px] text-muted-foreground">
                                {count.toLocaleString()} · {pct}%
                              </span>
                            </div>
                            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/5">
                              <div
                                className="h-full rounded-full bg-white transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-jetbrains-mono uppercase tracking-[0.12rem] mb-3 text-[10px] text-muted-foreground">
                    Top countries
                  </div>
                  {!isPending && data!.visitors.topCountries.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No country data for this range yet.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      {(data?.visitors.topCountries ?? []).map(([code, count]) => (
                        <span
                          key={code}
                          className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-background px-2 py-1 text-muted-foreground transition hover:border-white/20 hover:text-foreground"
                        >
                          <Globe2 className="h-3 w-3" />
                          {code} · {count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </OverviewCard>

            <RatingCardReal rating={data?.rating ?? null} />
          </div>
        </div>

        {/* Operations */}
        <div className="mt-6">
          <SectionHeading eyebrow="Operations" title="Orders & Reservations" />
          <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-2">
            {ordersEnabled ? (
              <OverviewCard>
                <CardHeading eyebrow="Orders" title={`Status Breakdown · ${effectiveRange}`} />
                <div className="mt-5">
                  <StatusBars items={orderStatusItems} totalLabel="Orders in range" />
                </div>
              </OverviewCard>
            ) : (
              <LockedPanel feature="Online ordering" requiredPlan="growth" blurb={ORDERS_BLURB}>
                <OverviewCard>
                  <CardHeading eyebrow="Orders" title={`Status Breakdown · ${effectiveRange}`} />
                  <div className="mt-5">
                    <StatusBars items={orderStatusItems} totalLabel="Orders in range" />
                  </div>
                </OverviewCard>
              </LockedPanel>
            )}

            {reservationsEnabled ? (
              <OverviewCard>
                <CardHeading eyebrow="Reservations" title={`Upcoming · Next ${effectiveRange}`} />
                <div className="mt-5">
                  <StatusBars items={reservationStatusItems} totalLabel="Reservations in range" />
                </div>
              </OverviewCard>
            ) : (
              <LockedPanel
                feature="Table reservations"
                requiredPlan="growth"
                blurb={RESERVATIONS_BLURB}
              >
                <OverviewCard>
                  <CardHeading eyebrow="Reservations" title={`Upcoming · Next ${effectiveRange}`} />
                  <div className="mt-5">
                    <StatusBars items={reservationStatusItems} totalLabel="Reservations in range" />
                  </div>
                </OverviewCard>
              </LockedPanel>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mt-6">
          <SectionHeading eyebrow="Content" title="What your visitors engage with" />
          <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-3">
            <OverviewCard className="xl:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardHeading eyebrow="Links" title="Top Performing Links" />
                <a
                  href="/dashboard/links"
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-muted-foreground transition hover:border-white/20 hover:text-foreground"
                >
                  MANAGE ALL →
                </a>
              </div>
              <div className="mt-4">
                <TopLinksCard links={data?.topLinks ?? []} />
              </div>
            </OverviewCard>

            <OverviewCard>
              <div className="flex items-center justify-between">
                <CardHeading eyebrow="Activity" title="Recent" />
                <span className="inline-flex items-center gap-1.5 font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-white">
                  <Activity className="h-3 w-3" /> LIVE
                </span>
              </div>
              <div className="mt-5 ">
                <ActivityFeed items={data?.recentActivity ?? []} />
              </div>
            </OverviewCard>
          </div>
        </div>

        {/* Shortcuts */}
        <div className="mt-6">
          <SectionHeading eyebrow="Shortcuts" title="Jump Back In" />
          <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-3">
            <OverviewCard>
              <div className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
                Quick actions
              </div>
              <div className="mt-4 space-y-2">
                {ordersEnabled ? (
                  <QuickLink icon={Hash} label="New order" href="/dashboard/orders/new" />
                ) : (
                  <QuickLink
                    icon={Hash}
                    label="Online ordering"
                    href="/dashboard/settings/subscription"
                    badge="growth"
                  />
                )}
                {reservationsEnabled ? (
                  <QuickLink
                    icon={CalendarPlus}
                    label="New Reservation"
                    href="/dashboard/reservations/new"
                  />
                ) : (
                  <QuickLink
                    icon={CalendarPlus}
                    label="Reservations"
                    href="/dashboard/settings/subscription"
                    badge="growth"
                  />
                )}
                <QuickLink icon={UtensilsCrossed} label="Edit Menu" href="/dashboard/menu" />
                <QuickLink icon={QrCode} label="QR Codes" href="/dashboard/qr" />
                {ordersEnabled && (
                  <QuickLink icon={Clock} label="View All Orders" href="/dashboard/orders" />
                )}
              </div>
            </OverviewCard>

            <SharePageCard slug={selectedRestaurant.slug} />

            <PlanCard
              plan={plan}
              retentionDays={viewableDays}
              entitlements={[
                { label: "Online ordering", enabled: ordersEnabled, requiredPlan: "growth" },
                {
                  label: "Table reservations",
                  enabled: reservationsEnabled,
                  requiredPlan: "growth",
                },
                {
                  label: "90-day analytics",
                  enabled: meetsPlan(plan, "growth"),
                  requiredPlan: "growth",
                },
                {
                  label: "365-day analytics",
                  enabled: meetsPlan(plan, "scale"),
                  requiredPlan: "scale",
                },
              ]}
            />
          </div>
        </div>
      </div>
    </>
  );
}
