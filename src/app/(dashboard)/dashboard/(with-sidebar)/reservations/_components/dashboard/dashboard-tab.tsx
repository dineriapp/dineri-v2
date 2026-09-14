"use client";

import { Calendar } from "@/components/ui/calendar";
import Loader from "@/components/ui/loader";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ReservationStatus } from "@/drizzle/schemas/reservation-schema";
import { ReservationWithArea } from "@/drizzle/types";
import {
  useReservationsPage,
  useReservationsSummary,
  useUpdateReservationStatus,
} from "@/lib/tanstack-react-query/hooks/reservation-dashboard";
import { cn } from "@/lib/utils";
import { endOfMonth, endOfWeek, format, isSameDay, startOfMonth, startOfWeek } from "date-fns";
import {
  Armchair,
  Ban,
  Calendar as CalendarIcon,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Eye,
  MapPin,
  Phone,
  Search,
  UserX,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { StatCard } from "../../../../_components";
import { PriorityBadge } from "../priority-badge";
import type { ReservationGroupId, ReservationsListFilters } from "./actions";
import { ReservationDetailDrawer } from "./reservation-detail-drawer";
import { paymentBadge, STATUS_META } from "./status-meta";

const GROUPS: { id: ReservationGroupId; label: string; icon: React.ElementType }[] = [
  { id: "awaiting", label: "Awaiting", icon: Clock },
  { id: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { id: "seated", label: "Seated", icon: Armchair },
  { id: "completed", label: "Completed", icon: CheckCheck },
  { id: "cancelled", label: "Cancelled", icon: Ban },
  { id: "no_show", label: "No-shows", icon: UserX },
];

const PAGE_SIZE = 25;

type RangeId = "today" | "week" | "month" | "all" | "custom";

const RANGES: { id: RangeId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
];

const EMPTY_COPY: Record<ReservationGroupId, string> = {
  awaiting: "Nothing awaiting confirmation or payment in this range.",
  confirmed: "No confirmed reservations in this range.",
  seated: "No seated reservations in this range.",
  completed: "No completed reservations in this range.",
  cancelled: "No cancellations in this range.",
  no_show: "No no-shows in this range.",
};

const iso = (d: Date) => format(d, "yyyy-MM-dd");

function resolveBounds(
  range: RangeId,
  customDate: Date,
): { from: string | null; to: string | null } {
  const now = new Date();
  switch (range) {
    case "all":
      return { from: null, to: null };
    case "today":
      return { from: iso(now), to: iso(now) };
    case "week":
      return {
        from: iso(startOfWeek(now, { weekStartsOn: 1 })),
        to: iso(endOfWeek(now, { weekStartsOn: 1 })),
      };
    case "month":
      return { from: iso(startOfMonth(now)), to: iso(endOfMonth(now)) };
    case "custom":
      return { from: iso(customDate), to: iso(customDate) };
  }
}

export function ReservationsDashboardTab() {
  const [range, setRange] = useState<RangeId>("today");
  const [customDate, setCustomDate] = useState<Date>(() => new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [group, setGroup] = useState<ReservationGroupId>("awaiting");
  const [detailReservation, setDetailReservation] = useState<ReservationWithArea | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const bounds = useMemo(() => resolveBounds(range, customDate), [range, customDate]);

  const summaryFilters = useMemo(
    () => ({ from: bounds.from, to: bounds.to, search: debouncedQuery }),
    [bounds.from, bounds.to, debouncedQuery],
  );
  const listFilters = useMemo<ReservationsListFilters>(
    () => ({ ...summaryFilters, group }),
    [summaryFilters, group],
  );

  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const pageIndex = cursorStack.length - 1;
  const currentCursor = cursorStack[pageIndex];

  useEffect(() => {
    setCursorStack([null]);
  }, [bounds.from, bounds.to, debouncedQuery, group]);

  const { data: summary, isPending: summaryPending } = useReservationsSummary(summaryFilters);
  const {
    data: listPage,
    isPending: listPending,
    isPlaceholderData: isListStale,
  } = useReservationsPage(listFilters, currentCursor);

  const list = listPage?.reservations ?? [];
  const groupCounts = summary?.groupCounts;
  const lostCount = (groupCounts?.cancelled ?? 0) + (groupCounts?.no_show ?? 0);

  const isCustom = range === "custom";
  const customIsToday = isSameDay(customDate, new Date());

  const pickCustomDate = (d: Date) => {
    setCustomDate(d);
    setRange("custom");
    setCalendarOpen(false);
  };

  const openDetail = (r: ReservationWithArea) => setDetailReservation(r);

  const rangeLabel = isCustom
    ? customIsToday
      ? "Today"
      : format(customDate, "EEE, MMM d, yyyy")
    : "Pick a date";

  const pageStart = list.length ? pageIndex * PAGE_SIZE + 1 : 0;
  const pageEnd = pageIndex * PAGE_SIZE + list.length;
  const groupTotal = groupCounts?.[group];

  const showRowDate = !(bounds.from !== null && bounds.from === bounds.to);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Reservations"
          value={summaryPending ? "—" : (summary?.total ?? 0)}
          icon={CalendarIcon}
          tone="white"
        />
        <StatCard
          label="Covers capacity"
          value={summaryPending ? "—" : (summary?.covers ?? 0)}
          icon={Users}
          tone="white"
        />
        <StatCard
          label="Awaiting"
          value={summaryPending ? "—" : (groupCounts?.awaiting ?? 0)}
          icon={Clock}
          tone="amber"
          hint={(groupCounts?.awaiting ?? 0) > 0 ? "Action needed" : undefined}
        />
        <StatCard
          label="Cancelled / no-shows"
          value={summaryPending ? "—" : lostCount}
          icon={Ban}
          hint={
            summaryPending || lostCount === 0
              ? undefined
              : `${groupCounts?.cancelled ?? 0} cancelled · ${groupCounts?.no_show ?? 0} no-show`
          }
        />
      </div>

      {/* Toolbar */}
      <div className="dash-card space-y-3 rounded-2xl border border-white/5 bg-surface-1 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-60">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search guest, phone, or email…"
              className="h-10 w-full rounded-xl border border-white/10 bg-background pl-9 pr-9 text-sm outline-none transition focus:border-white/40 focus:ring-2 focus:ring-white/20"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
                aria-label="Clear"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition",
                  isCustom
                    ? "border-white/40 bg-white/15 text-white"
                    : "border-white/10 bg-background hover:border-white/20",
                )}
              >
                <CalendarIcon className="h-3.5 w-3.5 text-white" />
                {rangeLabel}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={isCustom ? customDate : undefined}
                onSelect={(d) => d && pickCustomDate(d)}
                autoFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Range filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-jetbrains-mono mr-1 hidden text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
            Range
          </span>
          {RANGES.map((r) => {
            const active = range === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className={cn(
                  "inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition",
                  active
                    ? "border-white/50 bg-white text-background shadow-[0_6px_18px_-8px_rgba(255,255,255,0.6)]"
                    : "border-white/10 bg-background text-muted-foreground hover:border-white/20 hover:text-foreground",
                )}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Group filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-jetbrains-mono mr-1 hidden text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
            Status
          </span>
          {GROUPS.map((g) => {
            const active = group === g.id;
            const Icon = g.icon;
            return (
              <button
                key={g.id}
                onClick={() => setGroup(g.id)}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition ${
                  active
                    ? "border-white/40 bg-white/15 text-white"
                    : "border-white/10 bg-background text-muted-foreground hover:border-white/20 hover:text-foreground"
                }`}
              >
                <Icon className="h-3 w-3" />
                {g.label}
                <span
                  className={`rounded-md px-1.5 text-[10px] tabular-nums ${active ? "bg-background/40" : "bg-white/5"}`}
                >
                  {summaryPending ? "…" : (groupCounts?.[g.id] ?? 0)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div
        className={cn(
          "dash-card overflow-hidden rounded-2xl border border-white/5 bg-surface-1 transition-opacity",
          isListStale && "opacity-60",
        )}
      >
        {listPending ? (
          <Loader className="min-h-60" />
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-14 text-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-background text-muted-foreground">
              <CalendarIcon className="h-4 w-4 opacity-60" />
            </div>
            <div className="text-xs text-muted-foreground">
              {debouncedQuery ? "No reservations match your search." : EMPTY_COPY[group]}
            </div>
          </div>
        ) : (
          <>
            <div className="divide-y divide-white/5">
              {list.map((r) => (
                <DashboardReservationRow
                  key={r.id}
                  r={r}
                  showDate={showRowDate}
                  onOpen={() => openDetail(r)}
                />
              ))}
            </div>
            <div className="border-t border-white/5 bg-background/40 px-4 py-2.5 text-[11px] text-muted-foreground">
              Showing{" "}
              <span className="font-semibold tabular-nums text-foreground">
                {pageStart}-{pageEnd}
              </span>
              {groupTotal != null && (
                <>
                  {" "}
                  of <span className="tabular-nums text-foreground">{groupTotal}</span>
                </>
              )}{" "}
              reservations
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {(list.length > 0 || pageIndex > 0) && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCursorStack((p) => (p.length > 1 ? p.slice(0, -1) : p))}
            disabled={pageIndex === 0}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-background px-3 text-xs text-muted-foreground transition hover:border-white/20 hover:text-foreground disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Previous
          </button>
          <span className="font-jetbrains-mono px-2 text-[11px] text-muted-foreground">
            Page {pageIndex + 1}
          </span>
          <button
            onClick={() =>
              listPage?.nextCursor && setCursorStack((p) => [...p, listPage.nextCursor])
            }
            disabled={!listPage?.nextCursor}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-background px-3 text-xs text-muted-foreground transition hover:border-white/20 hover:text-foreground disabled:opacity-40"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {detailReservation && (
        <ReservationDetailDrawer
          reservation={detailReservation}
          onClose={() => setDetailReservation(null)}
        />
      )}
    </div>
  );
}

const DashboardReservationRow = ({
  r,
  showDate,
  onOpen,
}: {
  r: ReservationWithArea;
  showDate: boolean;
  onOpen: () => void;
}) => {
  const updateMutation = useUpdateReservationStatus();
  const statusMeta = STATUS_META[r.status];
  const paymentMeta = paymentBadge(r);

  const quickAdvance = (next: ReservationStatus) => {
    updateMutation.mutate(
      { id: r.id, status: next, paymentStatus: r.paymentStatus },
      {
        onSuccess: () => toast.success(`Marked as ${STATUS_META[next].label.toLowerCase()}`),
        onError: (err) => toast.error(err.message ?? "Failed to update reservation"),
      },
    );
  };

  return (
    <div className="group flex flex-col gap-3 px-4 py-3.5 transition hover:bg-background/40 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3 sm:w-20">
        <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border border-white/10 bg-background text-center">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="mt-0.5 text-xs font-semibold">{r.time.slice(0, 5)}</span>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium">{r.guestName}</span>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${statusMeta.cls}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} /> {statusMeta.label}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] ${paymentMeta.cls}`}
          >
            <CreditCard className="h-2.5 w-2.5" /> {paymentMeta.label}
          </span>
          {r.isPriorityReservation && <PriorityBadge />}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {showDate && (
            <span className="inline-flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              {format(new Date(`${r.date}T00:00:00`), "EEE, MMM d")}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" /> {r.partySize} guests
          </span>
          <span className="inline-flex items-center gap-1">
            <Phone className="h-3 w-3" /> {r.guestPhone}
          </span>
          {/* A priority booking taken on a full floor has no table yet. */}
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {r.area?.name ?? <span className="text-warning">Awaiting seating</span>}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {r.status === "pending" && (
          <button
            onClick={() => quickAdvance("confirmed")}
            disabled={updateMutation.isPending}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-info/30 bg-info/10 px-2.5 text-[11px] text-info hover:bg-info/20 disabled:opacity-50"
          >
            <Check className="h-3 w-3" /> Confirm
          </button>
        )}
        {r.status === "confirmed" && (
          <button
            onClick={() => quickAdvance("seated")}
            disabled={updateMutation.isPending}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-success/30 bg-success/10 px-2.5 text-[11px] text-success hover:bg-success/20 disabled:opacity-50"
          >
            <Check className="h-3 w-3" /> Seat
          </button>
        )}
        {r.status === "seated" && (
          <button
            onClick={() => quickAdvance("completed")}
            disabled={updateMutation.isPending}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/30 bg-white/10 px-2.5 text-[11px] text-white hover:bg-white/20 disabled:opacity-50"
          >
            <Check className="h-3 w-3" /> Complete
          </button>
        )}
        <button
          onClick={onOpen}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-background text-muted-foreground hover:border-white/20 hover:text-foreground"
          aria-label="View reservation"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
