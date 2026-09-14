"use client";

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AnalyticsDashboardData, AnalyticsEventType } from "@/lib/analytics/analytics";
import { getCountryName } from "@/lib/utils";
import { PlanName } from "@/lib/stripe/plans";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Download,
  Fingerprint,
  Globe,
  Lock,
  MapPin,
  Monitor,
  PieChart,
  Smartphone,
  Tablet,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactCountryFlag from "react-country-flag";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { DashSelect, Donut, SectionHeader, StatCard } from "../../../_components";
import TopBar from "../../../_components/top-bar";
import { useEffect, useMemo, useState } from "react";
import Loader from "@/components/ui/loader";
import { useIsMobile } from "@/hooks/use-mobile";

interface AnalyticsDashboardProps {
  data: AnalyticsDashboardData;
  availableTypes: AnalyticsEventType[];
  allowedRanges: string[];
  maxDays: number;
  isLimited: boolean;
  plan: PlanName;
}

const PLAN_LABEL: Record<PlanName, string> = {
  starter: "Starter",
  growth: "Growth",
  scale: "Scale",
};

const rangeOptions = [
  { label: "7 Days", value: "7" },
  { label: "15 Days", value: "15" },
  { label: "30 Days", value: "30" },
  { label: "90 Days", value: "90" },
  { label: "120 Days", value: "120" },
  { label: "6 Months", value: "180" },
  { label: "1 Year", value: "365" },
];

const typeOptions = [
  { label: "Pageviews", value: "pageview" },
  { label: "Menu Views", value: "menu" },
  { label: "Reserve Views", value: "reserve" },
];

const Badge = ({ percentage }: { percentage: number }) => {
  if (isNaN(percentage) || !isFinite(percentage)) return null;
  const isPositive = percentage > 0;
  const isNeutral = percentage === 0;
  const isNegative = percentage < 0;

  return (
    <span
      className={`inline-flex gap-1 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
        isPositive
          ? "bg-white/10 text-white ring-white/20"
          : isNeutral
            ? "bg-zinc-900/40 text-zinc-300 ring-zinc-400/30"
            : "bg-white/10 text-white ring-white/20"
      }`}
    >
      {isPositive ? <ArrowUpRight className="h-3 w-3" /> : null}
      {isNeutral ? <ArrowRight className="h-3 w-3" /> : null}
      {isNegative ? <ArrowDownRight className="h-3 w-3" /> : null}
      {percentage.toFixed(0)}%
    </span>
  );
};

const SOURCE_META: Record<string, { label: string; color: string }> = {
  direct: { label: "Direct", color: "#ffffff" },
  social: { label: "Social", color: "hsl(var(--info))" },
  google: { label: "Google", color: "hsl(var(--warning))" },
  qr: { label: "QR code", color: "hsl(var(--success))" },
  // Search
  bing: { label: "Bing", color: "#00809d" },
  duckduckgo: { label: "DuckDuckGo", color: "#de5833" },
  yahoo: { label: "Yahoo", color: "#6001d2" },
  // Social & messaging
  facebook: { label: "Facebook", color: "#1877f2" },
  instagram: { label: "Instagram", color: "#dd2a7b" },
  x: { label: "X (Twitter)", color: "#71767b" },
  tiktok: { label: "TikTok", color: "#25f4ee" },
  linkedin: { label: "LinkedIn", color: "#0a66c2" },
  reddit: { label: "Reddit", color: "#ff4500" },
  youtube: { label: "YouTube", color: "#ff0000" },
  pinterest: { label: "Pinterest", color: "#e60023" },
  snapchat: { label: "Snapchat", color: "#fffc00" },
  whatsapp: { label: "WhatsApp", color: "#25d366" },
  messenger: { label: "Messenger", color: "#a334fa" },
  telegram: { label: "Telegram", color: "#29a9eb" },
};

const AnalyticsDashboard = ({
  data,
  availableTypes,
  allowedRanges,
  maxDays,
  isLimited,
  plan,
}: AnalyticsDashboardProps) => {
  const {
    range,
    eventType,
    days,
    totalVisits,
    avgVisitorsPerDay,
    visitorsToday,
    uniqueVisitors,
    topCountries,
    topCities,
    deviceBreakdown,
    trafficSources,
  } = data;

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();

  const chartData = useMemo(
    () => days.map((day) => ({ name: day.date, Visitors: day.total })),
    [days],
  );

  const visibleRangeOptions = rangeOptions.filter((opt) => allowedRanges.includes(opt.value));
  const hasLockedRanges = visibleRangeOptions.length < rangeOptions.length;

  const handleRangeChange = (newRange: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("range", newRange);
    router.push(`?${params.toString()}`);
  };

  const handleTypeChange = (newType: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("range", range);
    params.set("type", newType);
    router.push(`?${params.toString()}`);
  };

  const maxVisitors = chartData.length ? Math.max(...chartData.map((d) => d.Visitors)) : 0;

  const chartConfig = {
    Visitors: { label: "Visitors", color: "#ffffff" },
  };

  useEffect(() => {
    setLoading(false);
  }, [data]);

  if (loading) {
    return <Loader className="min-h-100" text="Loading analytics…" />;
  }

  const channelSlices = trafficSources.map(([source, count]) => {
    const meta = SOURCE_META[source] ?? {
      label: source.charAt(0).toUpperCase() + source.slice(1),
      color: "#7c7f88",
    };
    return { label: meta.label, value: count, color: meta.color };
  });

  return (
    <>
      <TopBar page="Analytics" />

      <div className="p-4 sm:p-6">
        <div className="space-y-4 animate-fade-in sm:space-y-6">
          <SectionHeader
            iconClassName="text-white"
            icon={PieChart}
            title="Analytics"
            description="Real-time insights into traffic, sales, and customer engagement across your venue."
            badge={`${range} window`}
            actions={
              <>
                <DashSelect
                  value={eventType}
                  onValueChange={handleTypeChange}
                  ariaLabel="Event Type"
                  options={typeOptions.filter((opt) =>
                    availableTypes.includes(opt.value as AnalyticsEventType),
                  )}
                />
                <DashSelect
                  value={range}
                  onValueChange={(v) => handleRangeChange(v)}
                  ariaLabel="Range"
                  options={visibleRangeOptions}
                />
                <button
                  onClick={() =>
                    toast.info("Report exported", { description: "PDF download started." })
                  }
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-background px-3 text-xs hover:border-white/20"
                >
                  <Download className="h-3.5 w-3.5" /> Export report
                </button>
              </>
            }
          />

          {(isLimited || hasLockedRanges) && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-xs">
              <Lock className="h-4 w-4 shrink-0 text-white" />
              <span className="text-muted-foreground">
                {isLimited ? (
                  <>
                    Your <span className="font-medium text-foreground">{PLAN_LABEL[plan]}</span>{" "}
                    plan shows up to{" "}
                    <span className="font-medium text-foreground">{maxDays} days</span> of history -
                    the requested range was longer, so we&apos;re showing the maximum your plan
                    allows.
                  </>
                ) : (
                  <>
                    Your <span className="font-medium text-foreground">{PLAN_LABEL[plan]}</span>{" "}
                    plan shows up to{" "}
                    <span className="font-medium text-foreground">{maxDays} days</span> of history.
                    Upgrade to unlock a longer view.
                  </>
                )}
              </span>
              <Link
                href="/dashboard/settings/subscription"
                className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-lg bg-white px-3 py-1.5 font-semibold text-background hover:bg-white/90"
              >
                Upgrade
              </Link>
            </div>
          )}

          {/* Metric Cards – now with unique visitors */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
            <StatCard
              label="Avg. Visitors / Day"
              value={avgVisitorsPerDay}
              icon={Users}
              tone="white"
              hint=""
            />
            <StatCard
              label="Visitors Today"
              value={visitorsToday}
              icon={User}
              tone="white"
              hint={
                <Badge
                  percentage={
                    Number(avgVisitorsPerDay) > 0
                      ? (visitorsToday / Number(avgVisitorsPerDay) - 1) * 100
                      : 0
                  }
                />
              }
            />
            <StatCard
              label="Total Visits"
              value={totalVisits}
              icon={Globe}
              tone="white"
              hint={""}
            />
            <StatCard
              label="Unique Visitors"
              value={uniqueVisitors}
              icon={Fingerprint}
              tone="white"
              hint=""
            />
            <StatCard
              label="Peak Day"
              value={maxVisitors}
              icon={ArrowUpRight}
              tone="white"
              hint={""}
            />
          </div>

          {/* Top Countries & Cities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="dash-card rounded-2xl border border-white/5 bg-surface-1 p-4">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-white" />
                Top Countries
              </h2>
              {topCountries.length ? (
                <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                  {topCountries.map(([code, count], index) => (
                    <div
                      key={code}
                      className="flex items-center gap-4 rounded-lg border border-white/20 p-2"
                    >
                      <span className="w-5 text-center text-xs font-medium text-muted-foreground">
                        #{index + 1}
                      </span>

                      <ReactCountryFlag svg countryCode={code} className="h-7 w-7 rounded-sm" />

                      <span className="flex-1 font-medium text-xs">{getCountryName(code)}</span>

                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No country data for this period yet.
                </p>
              )}
            </div>

            <div className="dash-card rounded-2xl border border-white/5 bg-surface-1 p-4">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-white" />
                Top Cities
              </h2>
              {topCities.length ? (
                <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                  {topCities.map(([city, count], index) => {
                    return (
                      <div key={city} className="rounded-xl border border-white/20  p-2">
                        <div className="flex items-center gap-3">
                          <span className="w-5 text-center text-xs font-medium text-muted-foreground">
                            #{index + 1}
                          </span>

                          <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-white/10">
                            <MapPin className="h-3 w-3 text-white" />
                          </div>

                          <div className="flex-1">
                            <p className="font-medium truncate text-xs line-clamp-1">{city}</p>
                          </div>
                          <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white">
                            {count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No city data for this period yet.
                </p>
              )}
            </div>
          </div>

          {/* Chart*/}
          <div className="dash-card rounded-2xl border border-white/5 bg-surface-1 p-3 sm:p-4">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 shrink-0 text-white" />
              Daily Visitors
            </h2>
            {chartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-56 w-full sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="visitorsTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#2a2a2a" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#a1a1aa", fontSize: isMobile ? 10 : 11 }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                      minTickGap={isMobile ? 24 : 8}
                      tickFormatter={(v: string) => (isMobile ? String(v).slice(0, 5) : v)}
                    />
                    <YAxis
                      allowDecimals={false}
                      width={isMobile ? 28 : 40}
                      tick={{ fill: "#a1a1aa", fontSize: isMobile ? 10 : 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ChartTooltip
                      cursor={{ stroke: "#3f3f46", strokeDasharray: "4 4" }}
                      content={
                        <ChartTooltipContent
                          className="bg-zinc-900/90 border-zinc-700 text-white rounded-xl shadow-2xl"
                          labelClassName="text-zinc-300"
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="Visitors"
                      stroke="#ffffff"
                      strokeWidth={2}
                      fill="url(#visitorsTrend)"
                      dot={false}
                      activeDot={{
                        r: 4,
                        fill: "#ffffff",
                        stroke: "#09090b",
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-56 sm:h-72 flex items-center justify-center text-sm text-zinc-500">
                No data available.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="dash-card rounded-2xl border border-white/5 bg-surface-1 p-4 sm:p-5">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 shrink-0 text-white" />
                Traffic Sources
              </h2>
              <div className="mt-4">
                {channelSlices.length ? (
                  <Donut slices={channelSlices} />
                ) : (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No traffic data for this period yet.
                  </p>
                )}
              </div>
            </div>
            <div className="dash-card rounded-2xl border border-white/5 bg-surface-1 p-4 sm:p-5">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Monitor className="h-5 w-5 shrink-0 text-white" />
                Devices
              </h2>
              {deviceBreakdown.length ? (
                <div className="mt-4 space-y-3">
                  {deviceBreakdown.map(([device, count]) => {
                    const Icon =
                      device === "desktop" ? Monitor : device === "mobile" ? Smartphone : Tablet;
                    const total = deviceBreakdown.reduce((sum, [, c]) => sum + c, 0);
                    const percentage = Math.round(total ? (count / total) * 100 : 0);
                    return (
                      <div key={device}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2 text-foreground capitalize">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            {device}
                          </span>
                          <span className="tabular-nums text-muted-foreground">{percentage}%</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-background">
                          <div
                            className="h-full rounded-full bg-linear-to-r from-white/60 to-white"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No device data for this period yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AnalyticsDashboard;
