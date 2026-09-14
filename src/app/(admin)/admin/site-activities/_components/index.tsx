import { ACTIVITY_GROUP_STYLE } from "@/components/shared/activity-group-style";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ACTIVITY_GROUPS, type ActivityGroup } from "@/lib/activity/definitions";
import type { SiteActivityEntry } from "@/lib/activity/admin-query";
import { cn, timeAgo } from "@/lib/utils";
import { ArrowUpRight, ChevronLeft, ChevronRight, Search } from "lucide-react";
import Link from "next/link";

/** Every list page here is driven by the same three query params. */
export type ActivityQuery = { page?: string; group?: string; q?: string };

export function buildHref(base: string, query: ActivityQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.group) params.set("group", query.group);
  if (query.page && query.page !== "1") params.set("page", query.page);
  const search = params.toString();
  return search ? `${base}?${search}` : base;
}

export function parseGroup(value: string | undefined): ActivityGroup | undefined {
  return ACTIVITY_GROUPS.find((g) => g === value);
}

const SOURCE_STYLE: Record<string, string> = {
  merchant: "border-lime/25 bg-lime/10 text-lime",
  guest: "border-info/25 bg-info/10 text-info",
  system: "border-white/10 bg-background text-muted-foreground",
};

const formatDateTime = (d: string) =>
  new Date(d).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function PageHeading({
  icon: Icon,
  title,
  badge,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  badge?: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-surface-2 text-lime">
            <Icon className="h-4 w-4 shrink-0" />
          </div>
          <h1 className="font-inter-tight min-w-0 text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
            {title}
          </h1>
          {badge && (
            <span className="ml-1 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-background px-2 py-0.5 font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function StatTile({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  tone?: "default" | "lime";
}) {
  return (
    <div className="dash-card rounded-2xl border border-white/5 bg-surface-1 p-4">
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
          tone === "lime"
            ? "border-white/10 bg-lime/10 text-lime"
            : "border-white/10 bg-background text-muted-foreground",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-3 text-[11px] text-muted-foreground">{label}</div>
      <div className="font-inter-tight mt-0.5 text-xl font-semibold tabular-nums">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

/** Plain GET form so search survives without any client-side JS. */
export function SearchForm({
  action,
  defaultValue,
  placeholder,
  hidden,
}: {
  action: string;
  defaultValue?: string;
  placeholder: string;
  hidden?: Record<string, string | undefined>;
}) {
  return (
    <form action={action} className="relative w-full sm:max-w-xs">
      {Object.entries(hidden ?? {}).map(([name, value]) =>
        value ? <input key={name} type="hidden" name={name} value={value} /> : null,
      )}
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-9 w-full rounded-xl border border-white/10 bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-white/20"
      />
    </form>
  );
}

export function GroupFilter({
  base,
  query,
  active,
}: {
  base: string;
  query: ActivityQuery;
  active?: ActivityGroup;
}) {
  const chip = (label: string, group: ActivityGroup | undefined, isActive: boolean) => (
    <Link
      key={label}
      href={buildHref(base, { ...query, group, page: "1" })}
      className={cn(
        "inline-flex items-center rounded-lg border px-2.5 py-1 font-jetbrains-mono text-[10px] uppercase tracking-wider transition",
        isActive
          ? "border-lime/25 bg-lime/15 text-lime"
          : "border-white/10 bg-background text-muted-foreground hover:border-white/20 hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );

  return (
    <div className="flex flex-wrap gap-1.5">
      {chip("All", undefined, !active)}
      {ACTIVITY_GROUPS.map((group) =>
        chip(ACTIVITY_GROUP_STYLE[group].label, group, active === group),
      )}
    </div>
  );
}

export function ActivityTable({
  entries,
  showVenue = true,
}: {
  entries: SiteActivityEntry[];
  showVenue?: boolean;
}) {
  return (
    <div className="dash-card overflow-hidden rounded-2xl border border-white/5 bg-surface-1">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="h-11 px-4 font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Activity
              </TableHead>
              {showVenue && (
                <TableHead className="h-11 px-4 font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Restaurant
                </TableHead>
              )}
              <TableHead className="h-11 px-4 font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Actor
              </TableHead>
              <TableHead className="h-11 px-4 text-right font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                When
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => {
              const style = ACTIVITY_GROUP_STYLE[entry.group];
              const Icon = style.icon;

              return (
                <TableRow key={entry.id} className="border-white/5 hover:bg-white/3">
                  <TableCell className="min-w-70 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
                          style.className,
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm">{entry.title}</div>
                        {entry.meta && (
                          <div className="truncate text-xs text-muted-foreground">{entry.meta}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {showVenue && (
                    <TableCell className="px-4 py-3">
                      <Link
                        href={`/admin/site-activities/restaurants/${entry.venue.id}`}
                        className="block min-w-0 max-w-50 truncate text-xs font-medium hover:text-lime"
                      >
                        {entry.venue.name}
                      </Link>
                      <Link
                        href={`/r/${entry.venue.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-jetbrains-mono text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        /{entry.venue.slug}
                        <ArrowUpRight className="h-2.5 w-2.5 shrink-0 opacity-60" />
                      </Link>
                    </TableCell>
                  )}

                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-wider",
                          SOURCE_STYLE[entry.source] ?? SOURCE_STYLE.system,
                        )}
                      >
                        {entry.source}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {entry.actorName ?? "—"}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="text-xs text-muted-foreground">{timeAgo(entry.createdAt)}</div>
                    <div className="font-jetbrains-mono text-[10px] text-muted-foreground/70">
                      {formatDateTime(entry.createdAt)}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {entries.length === 0 && (
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableCell
                  colSpan={showVenue ? 4 : 3}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  No activity matches these filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/**
 * Page links rather than buttons, so paging is server-rendered, shareable, and
 * survives a refresh. Long ranges collapse around the current page.
 */
export function Pagination({
  base,
  query,
  page,
  pageCount,
  total,
  noun,
}: {
  base: string;
  query: ActivityQuery;
  page: number;
  pageCount: number;
  total: number;
  noun: string;
}) {
  if (total === 0) return null;

  const step = (to: number, label: string, icon: React.ReactNode, disabled: boolean) =>
    disabled ? (
      <span
        key={label}
        aria-disabled
        className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/5 bg-background px-2.5 text-xs text-muted-foreground/40"
      >
        {icon}
      </span>
    ) : (
      <Link
        key={label}
        href={buildHref(base, { ...query, page: String(to) })}
        aria-label={label}
        className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/10 bg-background px-2.5 text-xs text-muted-foreground transition hover:border-white/20 hover:text-foreground"
      >
        {icon}
      </Link>
    );

  const windowed = pageNumbers(page, pageCount);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        Page {page} of {pageCount} · {total.toLocaleString()} {noun}
      </span>
      <div className="flex items-center gap-1.5">
        {step(page - 1, "Previous page", <ChevronLeft className="h-3.5 w-3.5" />, page <= 1)}
        {windowed.map((n, i) =>
          n === null ? (
            <span key={`gap-${i}`} className="px-1 text-xs text-muted-foreground/50">
              …
            </span>
          ) : (
            <Link
              key={n}
              href={buildHref(base, { ...query, page: String(n) })}
              className={cn(
                "inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs tabular-nums transition",
                n === page
                  ? "border-lime/25 bg-lime/15 text-lime"
                  : "border-white/10 bg-background text-muted-foreground hover:border-white/20 hover:text-foreground",
              )}
            >
              {n}
            </Link>
          ),
        )}
        {step(page + 1, "Next page", <ChevronRight className="h-3.5 w-3.5" />, page >= pageCount)}
      </div>
    </div>
  );
}

/** First, last, and a window around the current page; `null` renders as an ellipsis. */
function pageNumbers(page: number, pageCount: number): (number | null)[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);

  const pages = new Set<number>([1, pageCount, page, page - 1, page + 1]);
  const sorted = [...pages].filter((n) => n >= 1 && n <= pageCount).sort((a, b) => a - b);

  const out: (number | null)[] = [];
  let previous = 0;
  for (const n of sorted) {
    if (previous && n - previous > 1) out.push(null);
    out.push(n);
    previous = n;
  }
  return out;
}
