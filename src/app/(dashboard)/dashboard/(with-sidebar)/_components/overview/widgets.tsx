"use client";

import { Sparkline, timeAgo } from "@/app/(dashboard)/dashboard/_components";
import type { GooglePlaceRating } from "@/lib/google/places";
import type { LinkType } from "@/drizzle/types";
import { cn } from "@/lib/utils";
import { PLAN_LABEL, PLAN_RANK } from "@/lib/stripe/checkers";
import type { PlanName } from "@/lib/stripe/plans";
import {
  ArrowUpRight,
  Check,
  Copy,
  Link as LinkIcon,
  Lock,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { ReactNode, useState } from "react";
import { toast } from "sonner";
import { ACTIVITY_GROUP_STYLE } from "@/components/shared/activity-group-style";
import type { ActivityEntry } from "@/lib/activity/definitions";

export const OverviewCard = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => (
  <div
    className={cn("dash-card rounded-2xl border border-white/5 bg-surface-1 p-4 sm:p-6", className)}
  >
    {children}
  </div>
);

export const CardHeading = ({ eyebrow, title }: { eyebrow: string; title: string }) => (
  <div>
    <div className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
      {eyebrow}
    </div>
    <h3 className="mt-1 font-inter-tight text-xl font-semibold">{title}</h3>
  </div>
);

/**
 * Groups the page into scannable bands. Without these the overview reads as one
 * undifferentiated wall of cards.
 */
export const SectionHeading = ({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) => (
  <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
    <div className="flex items-baseline gap-2.5">
      <span className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-white">
        {eyebrow}
      </span>
      <h2 className="font-inter-tight text-base font-semibold tracking-tight">{title}</h2>
    </div>
    <div className="flex items-center gap-2">
      {action}
      <div className="hidden h-px min-w-10 flex-1 bg-linear-to-r from-white/10 to-transparent sm:block" />
    </div>
  </div>
);

/**
 * Keeps a plan-gated widget on the page instead of hiding it - the merchant can
 * see the shape of what they are missing, blurred, with the upgrade path on top.
 * `tile` is for small stat cards; `panel` is for full cards with room for copy.
 */
export const LockedPanel = ({
  feature,
  requiredPlan,
  blurb,
  variant = "panel",
  className,
  children,
}: {
  feature: string;
  requiredPlan: PlanName;
  blurb?: string;
  variant?: "tile" | "panel";
  className?: string;
  children: ReactNode;
}) => (
  <div className={cn("relative isolate overflow-hidden rounded-2xl", className)}>
    <div aria-hidden className="pointer-events-none select-none opacity-25 blur-[3px]">
      {children}
    </div>

    <Link
      href="/dashboard/settings/subscription"
      className="group absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/15 bg-background/55 p-3 text-center backdrop-blur-[2px] transition hover:border-white/35 hover:bg-background/65"
    >
      {variant === "tile" ? (
        <>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/25 bg-white/10 text-white">
            <Lock className="h-3.5 w-3.5" />
          </span>
          <span className="font-jetbrains-mono text-[9px] uppercase tracking-[0.12rem] text-muted-foreground">
            {feature}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white">
            <Sparkles className="h-2.5 w-2.5" /> {PLAN_LABEL[requiredPlan]}
          </span>
        </>
      ) : (
        <>
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-linear-to-br from-white/15 via-white/5 to-transparent text-white">
            <Lock className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <div className="mt-0.5">
            <div className="font-inter-tight text-sm font-semibold">
              {feature} is a {PLAN_LABEL[requiredPlan]} feature
            </div>
            {blurb && (
              <p className="mx-auto mt-1 max-w-70 text-[11px] leading-relaxed text-muted-foreground">
                {blurb}
              </p>
            )}
          </div>
          <span className="mt-1 inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-[11px] font-semibold text-background transition group-hover:bg-white/90">
            Upgrade to unlock <ArrowUpRight className="h-3 w-3" />
          </span>
        </>
      )}
    </Link>
  </div>
);

export const DeltaBadge = ({ pct }: { pct: number | null }) => {
  if (pct === null) {
    return (
      <span className="font-jetbrains-mono text-[10px] uppercase tracking-[0.12rem] text-muted-foreground">
        n/a
      </span>
    );
  }
  const positive = pct > 0;
  const negative = pct < 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-jetbrains-mono text-[10px] uppercase tracking-[0.12rem]",
        positive && "text-white",
        negative && "text-danger",
        !positive && !negative && "text-muted-foreground",
      )}
    >
      {positive && <TrendingUp className="h-3 w-3" />}
      {negative && <TrendingDown className="h-3 w-3" />}
      {positive ? "+" : ""}
      {pct}%
    </span>
  );
};

export const TrendCard = ({
  icon: Icon,
  label,
  value,
  deltaPct,
  sparkline,
  hint,
  tone = "default",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  deltaPct: number | null;
  sparkline: number[];
  hint?: string;
  tone?: "default" | "white";
}) => {
  const hasData = sparkline.some((p) => p > 0);
  return (
    <OverviewCard className="group relative overflow-hidden p-5 transition hover:border-white/10">
      {/* Ambient wash keeps the tile from reading as a flat rectangle. */}
      <div
        className={cn(
          "pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl transition-opacity",
          tone === "white" ? "bg-white/10" : "bg-white/4",
          "opacity-60 group-hover:opacity-100",
        )}
      />
      <div className="relative flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-[10px] font-jetbrains-mono uppercase tracking-[0.12rem] text-muted-foreground">
          <span
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10",
              tone === "white" ? "bg-white/10 text-white" : "bg-background text-muted-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="truncate">{label}</span>
        </span>
        <DeltaBadge pct={deltaPct} />
      </div>
      <div className="relative mt-3 font-inter-tight text-3xl font-bold tracking-tight tabular-nums">
        {value}
      </div>
      {hint && <div className="relative mt-1 text-[11px] text-muted-foreground">{hint}</div>}
      <div className="relative mt-3 h-10">
        {hasData ? (
          <Sparkline
            points={sparkline}
            stroke="#ffffff"
            fill="rgba(255,255,255,0.10)"
            height={40}
          />
        ) : (
          <div className="flex h-full items-center gap-2 text-[10px] text-muted-foreground">
            <span className="h-px w-6 bg-white/10" />
            No activity yet in this range
          </div>
        )}
      </div>
    </OverviewCard>
  );
};

export const SnapshotTile = ({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
  pulse,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "white" | "amber";
  pulse?: boolean;
}) => (
  <OverviewCard className="group relative overflow-hidden p-4 transition hover:border-white/10">
    {/* Tone rail - a single glance tells you which tiles want attention. */}
    <span
      className={cn(
        "absolute inset-x-0 top-0 h-px",
        tone === "white" && "bg-linear-to-r from-transparent via-white/50 to-transparent",
        tone === "amber" && "bg-linear-to-r from-transparent via-warning/50 to-transparent",
        tone === "default" && "bg-linear-to-r from-transparent via-white/10 to-transparent",
      )}
    />
    <div className="flex items-start justify-between gap-2">
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 transition group-hover:scale-105",
          tone === "white" && "bg-white/10 text-white",
          tone === "amber" && "bg-warning/10 text-warning",
          tone === "default" && "bg-background text-muted-foreground",
          pulse && "animate-white-pulse",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      {pulse && (
        <span className="font-jetbrains-mono rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12rem] text-white">
          action
        </span>
      )}
    </div>
    <div className="mt-3 text-[11px] text-muted-foreground">{label}</div>
    <div className="mt-0.5 font-inter-tight text-2xl font-semibold tabular-nums">{value}</div>
    {hint && (
      <div className="font-jetbrains-mono mt-1 text-[9px] uppercase tracking-[0.12rem] text-muted-foreground">
        {hint}
      </div>
    )}
  </OverviewCard>
);

export const RatingCardReal = ({ rating }: { rating: GooglePlaceRating | null }) => {
  if (!rating) {
    return (
      <OverviewCard className="p-5">
        <div className="flex items-center justify-between">
          <span className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
            Avg. Rating
          </span>
          <Star className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Connect your Google Business Profile to show your live rating here.
        </p>
        <Link
          href="/dashboard/settings/integrations"
          className="mt-3 inline-flex items-center gap-1 text-xs text-white hover:text-white/90"
        >
          Connect Google <ArrowUpRight className="h-3 w-3" />
        </Link>
      </OverviewCard>
    );
  }

  return (
    <OverviewCard className="p-5">
      <div className="flex items-center justify-between">
        <span className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
          Avg. Rating
        </span>
        <span className="font-jetbrains-mono flex items-center gap-1 text-[10px] uppercase tracking-[0.12rem] text-white">
          <Star className="h-3 w-3 fill-white text-white" /> Google
        </span>
      </div>
      <div className="mt-2 font-inter-tight text-3xl font-bold tracking-tight">
        {rating.rating.toFixed(1)}
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">
        {rating.userRatingCount.toLocaleString()} review{rating.userRatingCount === 1 ? "" : "s"}
      </div>
    </OverviewCard>
  );
};

export const StatusBars = ({
  items,
  totalLabel,
}: {
  items: { label: string; value: number; color: string }[];
  totalLabel?: string;
}) => {
  const sum = items.reduce((s, it) => s + it.value, 0);
  const total = sum || 1;

  return (
    <div>
      {/* Stacked rail: the whole mix at a glance, before the per-status rows. */}
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/5">
        {sum > 0 &&
          items
            .filter((it) => it.value > 0)
            .map((it) => (
              <div
                key={it.label}
                className="h-full transition-all duration-500"
                style={{ width: `${(it.value / total) * 100}%`, background: it.color }}
                title={`${it.label}: ${it.value}`}
              />
            ))}
      </div>
      <div className="font-jetbrains-mono mt-2 flex items-center justify-between text-[9px] uppercase tracking-[0.12rem] text-muted-foreground">
        <span>{totalLabel ?? "Total"}</span>
        <span className="tabular-nums text-foreground">{sum.toLocaleString()}</span>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((it) => {
          const pct = sum === 0 ? 0 : Math.round((it.value / total) * 100);
          return (
            <div key={it.label} className="flex items-center gap-3">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: it.color }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-[12px]">{it.label}</span>
              <div className="hidden h-1 w-20 overflow-hidden rounded-full bg-white/5 sm:block">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: it.color }}
                />
              </div>
              <span className="font-jetbrains-mono w-16 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">
                {it.value.toLocaleString()} · {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Range picker where out-of-plan windows stay visible but locked, so the
 * merchant can see the history depth an upgrade buys.
 */
export const RangeSwitcher = <T extends string>({
  options,
  value,
  onChange,
  plan,
}: {
  options: { value: T; label: string; minPlan: PlanName }[];
  value: T;
  onChange: (v: T) => void;
  plan: PlanName;
}) => (
  <div className="flex items-center gap-0.5 rounded-xl border border-white/10 bg-background p-1 text-xs">
    {options.map((o) => {
      const locked = PLAN_RANK[plan] < PLAN_RANK[o.minPlan];
      const active = value === o.value;

      if (locked) {
        return (
          <Link
            key={o.value}
            href="/dashboard/settings/subscription"
            title={`${o.label} history is available on ${PLAN_LABEL[o.minPlan]} and above`}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-muted-foreground/60 transition hover:bg-white/5 hover:text-muted-foreground"
          >
            <Lock className="h-2.5 w-2.5" />
            {o.label}
          </Link>
        );
      }

      return (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-lg px-2.5 py-1 font-medium transition",
            active
              ? "bg-white text-background shadow-[0_6px_18px_-8px_rgba(255,255,255,0.6)]"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      );
    })}
  </div>
);

export const TopLinksCard = ({ links }: { links: LinkType[] }) => {
  const top = [...links]
    .filter((l) => l.active)
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);
  const maxClicks = Math.max(1, ...top.map((l) => l.clicks));

  if (top.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground">
        No active links yet.{" "}
        <Link href="/dashboard/links" className="text-white hover:text-white/90">
          Add your first link →
        </Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/5">
      {top.map((l) => (
        <div key={l.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-background">
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm">{l.title}</div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${Math.round((l.clicks / maxClicks) * 100)}%` }}
              />
            </div>
          </div>
          <div className="shrink-0 text-right text-sm tabular-nums">
            {l.clicks.toLocaleString()}
            <div className="font-jetbrains-mono text-[9px] uppercase tracking-[0.12rem] text-muted-foreground">
              clicks
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const ActivityFeed = ({ items }: { items: ActivityEntry[] }) => {
  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground">
        Nothing has happened here yet. Orders, bookings and page edits show up as they land.
      </div>
    );
  }
  return (
    <ul className="max-h-104 space-y-1 overflow-y-auto scrollbar-dark">
      {items.map((a) => {
        const { icon: Icon, className } = ACTIVITY_GROUP_STYLE[a.group];
        return (
          <li key={a.id}>
            <Link
              href={a.href}
              className="flex gap-3 rounded-xl px-2 py-2 transition hover:bg-white/3"
            >
              <span
                className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
                  className,
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{a.title}</span>
                <span className="font-jetbrains-mono block truncate  text-[9px] text-muted-foreground">
                  {timeAgo(a.createdAt)}
                  {a.meta && ` · ${a.meta}`}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export const QuickLink = ({
  icon: Icon,
  label,
  href,
  badge,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string;
}) => (
  <Link
    href={href}
    className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-background px-3 py-2.5 text-left text-sm transition hover:border-white/20 hover:bg-white/3"
  >
    <Icon className="h-4 w-4 text-muted-foreground" />
    <span className="flex-1">{label}</span>
    {badge && (
      <span className="font-jetbrains-mono uppercase tracking-[0.12rem] rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-white">
        {badge}
      </span>
    )}
    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
  </Link>
);

export const SharePageCard = ({ slug }: { slug: string }) => {
  const [copied, setCopied] = useState(false);

  const copyUrl = async () => {
    try {
      const url = `${window.location.origin}/r/${slug}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Copied", { description: "Page URL is on your clipboard." });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed", { description: "Try again." });
    }
  };

  return (
    <OverviewCard>
      <div className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
        Your page
      </div>
      <h3 className="mt-1 truncate font-inter-tight text-lg font-semibold">/r/{slug}</h3>
      <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-background px-3 py-2">
        <span className="font-jetbrains-mono uppercase tracking-[0.12rem] truncate text-[10px] text-muted-foreground">
          {typeof window !== "undefined" ? window.location.origin : ""}/r/{slug}
        </span>
        <button
          onClick={copyUrl}
          className="font-jetbrains-mono uppercase tracking-[0.12rem] shrink-0 pl-2 text-[10px] text-white hover:text-white/90"
        >
          {copied ? (
            <span className="inline-flex items-center gap-1">
              <Check className="h-3 w-3" /> copied
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Copy className="h-3 w-3" /> copy
            </span>
          )}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
        <a
          href={`/r/${slug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 font-semibold text-background hover:bg-white/90"
        >
          Visit <ArrowUpRight className="h-3 w-3" />
        </a>
        <Link
          href="/dashboard/qr"
          className="rounded-lg border border-white/10 px-3 py-1.5 hover:border-white/20"
        >
          Get QR code
        </Link>
      </div>
    </OverviewCard>
  );
};

/**
 * Replaces the two-line plan blurb with an honest entitlement checklist, so the
 * merchant can see what their plan does and does not include without guessing
 * from which cards happen to be locked.
 */
export const PlanCard = ({
  plan,
  retentionDays,
  entitlements,
}: {
  plan: PlanName;
  retentionDays: number;
  entitlements: { label: string; enabled: boolean; requiredPlan: PlanName }[];
}) => (
  <OverviewCard className="relative overflow-hidden">
    <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-white/8 blur-3xl" />
    <div className="relative flex items-start justify-between gap-3">
      <div>
        <div className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
          Your plan
        </div>
        <h3 className="mt-1 font-inter-tight text-lg font-semibold">{PLAN_LABEL[plan]}</h3>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/25 bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white">
        <Sparkles className="h-2.5 w-2.5" /> {retentionDays}d history
      </span>
    </div>

    <div className="relative mt-4 space-y-2">
      {entitlements.map((e) => (
        <div key={e.label} className="flex items-center justify-between gap-2 text-xs">
          <span
            className={cn(
              "flex min-w-0 items-center gap-1.5",
              e.enabled ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {e.enabled ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-white" />
            ) : (
              <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate">{e.label}</span>
          </span>
          {e.enabled ? (
            <span className="font-jetbrains-mono shrink-0 text-[9px] uppercase tracking-[0.12rem] text-white">
              included
            </span>
          ) : (
            <span className="font-jetbrains-mono shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12rem] text-muted-foreground">
              {PLAN_LABEL[e.requiredPlan]}
            </span>
          )}
        </div>
      ))}
    </div>

    {plan !== "scale" && (
      <Link
        href="/dashboard/settings/subscription"
        className="relative mt-4 flex w-full items-center justify-center gap-1 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-background transition hover:bg-white/90"
      >
        Upgrade plan <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    )}
  </OverviewCard>
);
