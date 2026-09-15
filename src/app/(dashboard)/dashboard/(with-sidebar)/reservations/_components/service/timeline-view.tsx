"use client";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ReservationStatus } from "@/drizzle/schemas/reservation-schema";
import { ReservationAreaWithTables, ReservationWithArea } from "@/drizzle/types";
import { useReservationAreas } from "@/lib/tanstack-react-query/hooks/reservation-areas";
import {
  useAreaDayReservations,
  useMoveReservation,
  useServiceDayOverview,
  useUnseatedDayReservations,
  useUpdateReservationStatus,
} from "@/lib/tanstack-react-query/hooks/reservation-dashboard";
import { canRefund, refundableCents } from "@/lib/reservations/refunds";
import { fmtMoney } from "@/lib/stripe/types";
import { cn } from "@/lib/utils";
import { useSelectedRestaurant } from "@/stores/restaurant-store";
import { format, isSameDay } from "date-fns";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  GripVertical,
  Mail,
  Phone,
  Star,
  TrendingUp,
  Undo2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { isTerminalStatus, paymentBadge } from "../dashboard/status-meta";
import { PriorityBadge } from "../priority-badge";
import { RefundDialog } from "../refund-dialog";
import { alignToWindow, buildTimelineWindow, fmt, TimelineWindow, toMin } from "./utils";

const DAY_MIN = 24 * 60;
const ROW_H = 64;

const TABLE_COL_PX = 96;
const PX_PER_HOUR = 160;
const MIN_SLOT_PX = 208;

const MAX_EXPANDED_AREAS = 2;

const SNAP_MIN = 15;

type DragTarget = {
  tableId: string;
  minutes: number;
  valid: boolean;
  reason?: string;
};

const sameTarget = (a: DragTarget | null, b: DragTarget | null) =>
  a === b ||
  (!!a && !!b && a.tableId === b.tableId && a.minutes === b.minutes && a.valid === b.valid);

const STATUS_META: Record<ReservationStatus, { label: string; block: string; dot: string }> = {
  pending: {
    label: "Pending",
    block: "border-warning/40 bg-warning/12 text-warning",
    dot: "bg-warning",
  },
  confirmed: { label: "Confirmed", block: "border-info/40 bg-info/12 text-info", dot: "bg-info" },
  seated: {
    label: "Seated",
    block: "border-success/40 bg-success/12 text-success",
    dot: "bg-success",
  },
  completed: {
    label: "Completed",
    block: "border-white/40 bg-white/12 text-white",
    dot: "bg-white",
  },
  no_show: {
    label: "No-show",
    block: "border-danger/40 bg-danger/12 text-danger",
    dot: "bg-danger",
  },
  cancelled: {
    label: "Cancelled",
    block: "border-white/10 bg-white/5 text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

export function TimelineView({ slotMinutes = 90 }: { slotMinutes?: number }) {
  const [expandedAreas, setExpandedAreas] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refundTarget, setRefundTarget] = useState<ReservationWithArea | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragTarget, setDragTarget] = useState<DragTarget | null>(null);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const selectedRestaurant = useSelectedRestaurant();
  const dur = Math.min(
    DAY_MIN,
    Math.max(15, selectedRestaurant?.reservation_settings?.slotDurationMinutes ?? slotMinutes),
  );

  const isToday = isSameDay(selectedDate, new Date());
  const dayIso = format(selectedDate, "yyyy-MM-dd");
  const dayLabel = format(selectedDate, "EEEE, MMMM d");

  const shiftDay = (delta: number) =>
    setSelectedDate((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() + delta);
      return next;
    });

  const { data: areas = [] } = useReservationAreas();
  const { data: overview, isPending } = useServiceDayOverview(dayIso);
  const updateMutation = useUpdateReservationStatus();
  const moveMutation = useMoveReservation();

  const tableById = useMemo(() => {
    const map = new Map<string, { id: string; label: string; seats: number }>();
    for (const a of areas) for (const t of a.tables) map.set(t.id, t);
    return map;
  }, [areas]);

  const didAutoExpand = useRef(false);
  useEffect(() => {
    if (!didAutoExpand.current && areas.length > 0) {
      didAutoExpand.current = true;
      setExpandedAreas([areas[0].id]);
    }
  }, [areas]);

  const toggleArea = (id: string) =>
    setExpandedAreas((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      const next = [...prev, id];
      return next.length > MAX_EXPANDED_AREAS ? next.slice(next.length - MAX_EXPANDED_AREAS) : next;
    });

  const tableCount = useMemo(() => areas.reduce((n, a) => n + a.tables.length, 0), [areas]);

  const slotA = expandedAreas[0] ?? "";
  const slotB = expandedAreas[1] ?? "";
  const areaQueryA = useAreaDayReservations(dayIso, slotA, !!slotA);
  const areaQueryB = useAreaDayReservations(dayIso, slotB, !!slotB);

  const unseatedCount = overview?.areas.find((a) => a.areaId === null)?.total ?? 0;
  const { data: unseatedRows = [], isPending: unseatedLoading } = useUnseatedDayReservations(
    dayIso,
    unseatedCount > 0,
  );

  const rowsByArea = useMemo(() => {
    const map = new Map<string, { rows: ReservationWithArea[]; loading: boolean }>();
    if (slotA) map.set(slotA, { rows: areaQueryA.data ?? [], loading: areaQueryA.isPending });
    if (slotB) map.set(slotB, { rows: areaQueryB.data ?? [], loading: areaQueryB.isPending });
    return map;
  }, [slotA, slotB, areaQueryA.data, areaQueryA.isPending, areaQueryB.data, areaQueryB.isPending]);

  const loadedReservations = useMemo(
    () => [...(areaQueryA.data ?? []), ...(areaQueryB.data ?? []), ...unseatedRows],
    [areaQueryA.data, areaQueryB.data, unseatedRows],
  );

  // The ruler spans this day's opening hours instead of a flat 24 hours.
  // Unseated bookings are left out on purpose - they sit on no table, so they
  // can't stretch the tracks.
  const seatedStartMinutes = useMemo(
    () =>
      loadedReservations
        .filter(
          (r) => r.assignedTables.length > 0 && r.status !== "cancelled" && r.status !== "no_show",
        )
        .map((r) => toMin(r.time.slice(0, 5))),
    [loadedReservations],
  );

  // Named to keep the global `window` (used by the drag handlers) reachable.
  const timelineWindow = useMemo(
    () =>
      buildTimelineWindow({
        openingHours: selectedRestaurant?.opening_hours,
        date: selectedDate,
        bookingStartMinutes: seatedStartMinutes,
        slotMinutes: dur,
      }),
    [selectedRestaurant?.opening_hours, selectedDate, seatedStartMinutes, dur],
  );

  const { startMin, endMin, rangeMin } = timelineWindow;

  const openingLabel = timelineWindow.closedDay
    ? "Closed this day - showing the full day"
    : `${fmt(startMin)} - ${fmt(endMin)}`;

  const byTable = useMemo(() => {
    const map = new Map<string, ReservationWithArea[]>();
    for (const r of loadedReservations) {
      if (r.status === "cancelled" || r.status === "no_show") continue;
      for (const t of r.assignedTables) {
        const list = map.get(t.id);
        if (list) list.push(r);
        else map.set(t.id, [r]);
      }
    }
    return map;
  }, [loadedReservations]);

  const areaStats = useMemo(() => {
    const map = new Map<string, { total: number; covers: number; pending: number }>();
    for (const a of overview?.areas ?? []) {
      if (!a.areaId) continue;
      map.set(a.areaId, { total: a.total, covers: a.covers, pending: a.pending });
    }
    return map;
  }, [overview]);

  const kpis = useMemo(
    () => ({
      covers: overview?.covers ?? 0,
      confirmed: overview?.confirmed ?? 0,
      pending: overview?.pending ?? 0,
      occupancy:
        tableCount && overview ? Math.round((overview.occupiedTables / tableCount) * 100) : 0,
    }),
    [overview, tableCount],
  );

  const selected = loadedReservations.find((r) => r.id === selectedId) ?? null;
  const areaName = (id: string | null) =>
    id ? (areas.find((a) => a.id === id)?.name ?? "-") : "Awaiting seating";

  const incomingCount = (overview?.pending ?? 0) + (overview?.confirmed ?? 0);

  const localValidity = (
    r: ReservationWithArea,
    tableId: string,
    minutes: number,
  ): { valid: boolean; reason?: string } => {
    const table = tableById.get(tableId);
    if (!table) return { valid: false, reason: "That table no longer exists." };

    if (table.seats < r.partySize) {
      return {
        valid: false,
        reason: `${table.label} seats ${table.seats}, but this booking is for ${r.partySize}.`,
      };
    }

    const end = minutes + dur;
    for (const other of byTable.get(tableId) ?? []) {
      if (other.id === r.id) continue;
      const otherStart = toMin(other.time.slice(0, 5));
      if (minutes < otherStart + dur && otherStart < end) {
        return { valid: false, reason: `${table.label} is already booked at that time.` };
      }
    }

    return { valid: true };
  };

  const beginDrag = (e: React.PointerEvent<HTMLElement>, r: ReservationWithArea) => {
    if (moveMutation.isPending) return;

    if (r.assignedTables.length > 1) {
      toast("This booking spans several tables", {
        description: "Combined-table reservations can't be dragged yet.",
      });
      return;
    }

    const block = e.currentTarget.closest<HTMLElement>("[data-reservation-block]");
    if (!block) return;

    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    let moved = false;
    let latest: DragTarget | null = null;
    let frame = 0;
    let pointer: { x: number; y: number } | null = null;

    setDraggingId(r.id);

    const resolveTarget = (clientX: number, clientY: number): DragTarget | null => {
      const track = document
        .elementsFromPoint(clientX, clientY)
        .find((el): el is HTMLElement => el instanceof HTMLElement && !!el.dataset.trackTable);
      if (!track) return null;

      const tableId = track.dataset.trackTable!;
      const rect = track.getBoundingClientRect();
      const raw = startMin + ((clientX - rect.left) / rect.width) * rangeMin;
      const snapped = Math.round(raw / SNAP_MIN) * SNAP_MIN;
      const minutes = Math.max(startMin, Math.min(Math.max(startMin, endMin - dur), snapped));

      return { tableId, minutes, ...localValidity(r, tableId, minutes) };
    };

    const paint = () => {
      frame = 0;
      if (!pointer) return;

      block.style.transform = `translate(${pointer.x - startX}px, ${pointer.y - startY}px)`;

      const next = moved ? resolveTarget(pointer.x, pointer.y) : null;
      if (!sameTarget(next, latest)) {
        latest = next;
        setDragTarget(next);
      }
    };

    const move = (ev: PointerEvent) => {
      if (!moved && (Math.abs(ev.clientX - startX) > 4 || Math.abs(ev.clientY - startY) > 4)) {
        moved = true;
      }
      pointer = { x: ev.clientX, y: ev.clientY };
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (frame) cancelAnimationFrame(frame);
      const target = moved ? resolveTarget(ev.clientX, ev.clientY) : null;

      block.style.transform = "";
      setDraggingId(null);
      setDragTarget(null);

      if (!moved) {
        setSelectedId(r.id);
        return;
      }

      if (!target) return;

      const newTime = fmt(target.minutes);
      const unchanged =
        target.tableId === r.assignedTables[0]?.id && newTime === r.time.slice(0, 5);
      if (unchanged) return;

      if (!target.valid) {
        toast.error("Can't move this reservation", { description: target.reason });
        return;
      }

      moveMutation.mutate(
        { id: r.id, tableId: target.tableId, time: newTime },
        {
          onSuccess: () =>
            toast.success(
              `Moved to ${tableById.get(target.tableId)?.label ?? "table"} at ${newTime}`,
            ),
          onError: (err) =>
            toast.error("Can't move this reservation", { description: err.message }),
        },
      );
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const nowDate = new Date(now);
  const nowMin = alignToWindow(nowDate.getHours() * 60 + nowDate.getMinutes(), {
    start: startMin,
    end: endMin,
  });
  const nowPct = ((nowMin - startMin) / rangeMin) * 100;
  const nowInWindow = nowMin >= startMin && nowMin <= endMin;

  const quickStatus = (r: ReservationWithArea, status: ReservationStatus) => {
    updateMutation.mutate(
      { id: r.id, status, paymentStatus: r.paymentStatus },
      {
        onSuccess: () => toast.success(`Marked as ${STATUS_META[status].label.toLowerCase()}`),
        onError: (err) => toast.error(err.message ?? "Failed to update reservation"),
      },
    );
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header: title + date stepper */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-inter-tight text-xl font-semibold sm:text-2xl">Service timeline</h2>
            <div className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-surface-1 p-0.5">
              <button
                onClick={() => shiftDay(-1)}
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
                aria-label="Previous day"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-medium hover:bg-background">
                    <CalendarDays className="h-3.5 w-3.5 text-white" />
                    {isToday ? "Today" : dayLabel}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => {
                      if (d) {
                        setSelectedDate(d);
                        setCalendarOpen(false);
                      }
                    }}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
              <button
                onClick={() => shiftDay(1)}
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
                aria-label="Next day"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Open an area to see its tables across{" "}
            {timelineWindow.closedDay ? "the full day" : `${fmt(startMin)}-${fmt(endMin)}`}. Click a
            reservation for details.
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Users} label="Covers" value={kpis.covers} tone="white" />
        <Kpi icon={CheckCircle2} label="Confirmed" value={kpis.confirmed} />
        <Kpi icon={Clock} label="Pending" value={kpis.pending} />
        <Kpi icon={TrendingUp} label="Occupancy" value={`${kpis.occupancy}%`} />
      </div>

      {/* Main: area sections + sidebar */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
            <span className="font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {areas.length} areas · {tableCount} tables · {openingLabel}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Up to {MAX_EXPANDED_AREAS} areas open at once
            </span>
          </div>

          {unseatedCount > 0 && (
            <UnseatedSection
              count={unseatedCount}
              rows={unseatedRows}
              loading={unseatedLoading}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}

          {isPending ? (
            <div className="dash-card rounded-2xl border border-white/5 bg-surface-1 px-4 py-10 text-center text-sm text-muted-foreground">
              Loading reservations…
            </div>
          ) : areas.length === 0 ? (
            <div className="dash-card rounded-2xl border border-white/5 bg-surface-1 px-4 py-10 text-center text-sm text-muted-foreground">
              No areas configured yet.
            </div>
          ) : (
            areas.map((area) => (
              <AreaSection
                key={area.id}
                area={area}
                open={expandedAreas.includes(area.id)}
                onToggle={() => toggleArea(area.id)}
                stats={areaStats.get(area.id)}
                rows={rowsByArea.get(area.id)?.rows ?? []}
                rowsLoading={rowsByArea.get(area.id)?.loading ?? false}
                dur={dur}
                window={timelineWindow}
                showNow={isToday && nowInWindow}
                nowPct={nowPct}
                draggingId={draggingId}
                dragTarget={dragTarget}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onHandlePointerDown={beginDrag}
              />
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 ">
          <div className="dash-card sticky top-6 z-20 rounded-2xl border border-white/5 bg-surface-1 p-4">
            {selected ? (
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{selected.guestName}</div>
                    {selected.isPriorityReservation && <PriorityBadge className="mt-1" />}
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" /> {selected.guestPhone}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                      STATUS_META[selected.status].block,
                    )}
                  >
                    <span
                      className={cn("h-1.5 w-1.5 rounded-full", STATUS_META[selected.status].dot)}
                    />
                    {STATUS_META[selected.status].label}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <Meta label="Party" value={`${selected.partySize}p`} />
                  <Meta label="Time" value={selected.time.slice(0, 5)} />
                  <Meta
                    label="Table(s)"
                    value={
                      selected.assignedTables.length > 0
                        ? selected.assignedTables.map((t) => t.label).join(", ")
                        : "Unassigned"
                    }
                  />
                  <Meta label="Area" value={areaName(selected.areaId)} />
                </dl>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" /> {selected.guestEmail}
                </div>
                <div className="mt-3">
                  <div className="mb-1.5 flex items-center gap-1.5 font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <CreditCard className="h-3 w-3" /> Payment
                  </div>
                  {/* Read-only: Stripe is the only way a deposit is ever taken. */}
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-background px-3 py-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider",
                        paymentBadge(selected).cls,
                      )}
                    >
                      {paymentBadge(selected).label}
                    </span>
                    <span className="font-inter-tight text-sm font-semibold tabular-nums">
                      {fmtMoney(
                        Number(
                          selected.paymentStatus === "free" ? selected.amount : selected.paidAmount,
                        ),
                        selected.currency ?? selectedRestaurant?.stripe?.currency ?? null,
                      )}
                    </span>
                  </div>
                  {canRefund(selected) && (
                    <button
                      onClick={() => setRefundTarget(selected)}
                      className="mt-1.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-background px-3 py-2 text-[11px] font-semibold transition hover:border-white/30"
                    >
                      <Undo2 className="h-3 w-3" />
                      Refund{" "}
                      {fmtMoney(
                        refundableCents(selected.paidAmount, selected.refundedAmount) / 100,
                        selected.currency ?? selectedRestaurant?.stripe?.currency ?? null,
                      )}
                    </button>
                  )}
                </div>
                {selected.note && (
                  <p className="mt-3 rounded-lg border border-white/5 bg-background p-2 text-xs text-muted-foreground">
                    {selected.note}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {selected.status === "pending" && (
                    <button
                      onClick={() => quickStatus(selected, "confirmed")}
                      disabled={updateMutation.isPending}
                      className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border border-info/30 bg-info/10 px-3 text-xs font-medium text-info hover:bg-info/15 disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" /> Confirm
                    </button>
                  )}
                  {selected.status === "confirmed" && (
                    <button
                      onClick={() => quickStatus(selected, "seated")}
                      disabled={updateMutation.isPending}
                      className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border border-success/30 bg-success/10 px-3 text-xs font-medium text-success hover:bg-success/15 disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" /> Seat
                    </button>
                  )}
                  {selected.status === "seated" && (
                    <button
                      onClick={() => quickStatus(selected, "completed")}
                      disabled={updateMutation.isPending}
                      className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border border-white/30 bg-white/10 px-3 text-xs font-medium text-white hover:bg-white/15 disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" /> Complete
                    </button>
                  )}
                  {!isTerminalStatus(selected.status) && (
                    <button
                      onClick={() => quickStatus(selected, "cancelled")}
                      disabled={updateMutation.isPending}
                      className="inline-flex h-8 flex-1 items-center justify-center rounded-lg border border-danger/30 bg-danger/10 px-3 text-xs font-medium text-danger hover:bg-danger/15 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center">
                <div className="text-sm font-medium">No reservation selected</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Click any block on the timeline to see details and update its status.
                </p>
              </div>
            )}
          </div>

          <div className="dash-card rounded-2xl border border-white/5 bg-surface-1">
            <div className="flex items-center justify-between border-b border-white/5 px-3 py-2.5">
              <span className="text-xs font-medium">Incoming</span>
              {incomingCount > 0 && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-white/10 px-1 text-[10px] font-semibold text-muted-foreground">
                  {incomingCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <RefundDialog
        open={!!refundTarget}
        onOpenChange={(open) => !open && setRefundTarget(null)}
        target={
          refundTarget && {
            id: refundTarget.id,
            guestName: refundTarget.guestName,
            paidAmount: refundTarget.paidAmount,
            refundedAmount: refundTarget.refundedAmount,
            currency: refundTarget.currency ?? selectedRestaurant?.stripe?.currency ?? null,
          }
        }
      />
    </div>
  );
}

function UnseatedSection({
  count,
  rows,
  loading,
  selectedId,
  onSelect,
}: {
  count: number;
  rows: ReservationWithArea[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="dash-card overflow-hidden rounded-2xl border border-warning/25 bg-warning/5">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-warning/30 bg-warning/10 text-warning">
          <Star className="h-4 w-4 fill-current" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">Awaiting seating</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            Accepted on a full floor - assign a table when one frees up.
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full border border-warning/30 bg-warning/12 px-2 py-0.5 text-[10px] font-medium text-warning">
          {count} booking{count === 1 ? "" : "s"}
        </span>
      </div>

      <div className="border-t border-warning/15">
        {loading ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</div>
        ) : (
          <ul className="divide-y divide-white/5">
            {rows.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => onSelect(r.id)}
                  className={cn(
                    "flex w-full flex-wrap items-center gap-2 px-4 py-2.5 text-left transition hover:bg-background/40",
                    selectedId === r.id && "bg-background/60",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.guestName}</span>
                  {r.isPriorityReservation && <PriorityBadge />}
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-2.5 w-2.5" /> {r.time.slice(0, 5)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Users className="h-2.5 w-2.5" /> {r.partySize}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                      STATUS_META[r.status].block,
                    )}
                  >
                    {STATUS_META[r.status].label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AreaSection({
  area,
  open,
  onToggle,
  stats,
  rows,
  rowsLoading,
  dur,
  window: timelineWindow,
  showNow,
  nowPct,
  draggingId,
  dragTarget,
  selectedId,
  onSelect,
  onHandlePointerDown,
}: {
  area: ReservationAreaWithTables;
  open: boolean;
  onToggle: () => void;
  stats?: { total: number; covers: number; pending: number };
  rows: ReservationWithArea[];
  rowsLoading: boolean;
  dur: number;
  window: TimelineWindow;
  showNow: boolean;
  nowPct: number;
  draggingId: string | null;
  dragTarget: DragTarget | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onHandlePointerDown: (e: React.PointerEvent<HTMLElement>, r: ReservationWithArea) => void;
}) {
  const { startMin, endMin, rangeMin, ticks } = timelineWindow;

  const pxPerHour = Math.max(PX_PER_HOUR, (MIN_SLOT_PX * 60) / dur);
  const trackWidth = Math.round(TABLE_COL_PX + (rangeMin / 60) * pxPerHour);

  const rowsByTable = useMemo(() => {
    const map = new Map<string, ReservationWithArea[]>();
    for (const r of rows) {
      if (r.status === "cancelled" || r.status === "no_show") continue;
      for (const t of r.assignedTables) {
        const list = map.get(t.id);
        if (list) list.push(r);
        else map.set(t.id, [r]);
      }
    }
    return map;
  }, [rows]);

  return (
    <div className="dash-card overflow-hidden rounded-2xl border border-white/5 bg-surface-1">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-background/40"
      >
        <ChevronRight
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-90 text-white",
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{area.name}</div>
          <div className="mt-0.5 font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {area.tables.length} tables
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {(stats?.pending ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/12 px-2 py-0.5 text-[10px] font-medium text-warning">
              {stats!.pending} pending
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
            {stats?.total ?? 0} reservations
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
            <Users className="h-2.5 w-2.5" /> {stats?.covers ?? 0}
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-white/5">
          {area.tables.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No tables in this area.
            </div>
          ) : rowsLoading ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Loading {area.name}…
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div style={{ width: trackWidth }}>
                {/* time header */}
                <div className="flex border-b border-white/5">
                  <div className="w-24 shrink-0 border-r border-white/5 px-3 py-2.5 font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Table
                  </div>
                  <div className="relative h-9 flex-1">
                    {ticks.map((m) => (
                      <span
                        key={m}
                        className="absolute top-2.5 -translate-x-1/2 font-jetbrains-mono text-[10px] text-muted-foreground"
                        style={{ left: `${((m - startMin) / rangeMin) * 100}%` }}
                      >
                        {fmt(m)}
                      </span>
                    ))}
                  </div>
                </div>

                {area.tables.map((t) => {
                  const rowResos = rowsByTable.get(t.id) ?? [];
                  return (
                    <div key={t.id} className="flex border-b border-white/5 last:border-0">
                      <div className="flex w-24 shrink-0 flex-col justify-center border-r border-white/5 px-3 py-2">
                        <span className="text-sm font-semibold leading-none">{t.label}</span>
                        <span className="mt-0.5 text-[11px] text-muted-foreground">{t.seats}p</span>
                      </div>
                      <div
                        data-track-table={t.id}
                        className="relative flex-1"
                        style={{ height: ROW_H }}
                      >
                        {dragTarget?.tableId === t.id && (
                          <span
                            className={cn(
                              "pointer-events-none transition-all duration-150 absolute top-1.5 bottom-1.5 z-10 rounded-lg border-2 border-dashed",
                              dragTarget.valid
                                ? "border-white bg-white/15"
                                : "border-danger bg-danger/15",
                            )}
                            style={{
                              left: `${((dragTarget.minutes - startMin) / rangeMin) * 100}%`,
                              width: `calc(${(dur / rangeMin) * 100}% - 4px)`,
                            }}
                          />
                        )}
                        {ticks.map((m) => (
                          <span
                            key={m}
                            className="pointer-events-none absolute inset-y-0 w-px bg-white/5"
                            style={{ left: `${((m - startMin) / rangeMin) * 100}%` }}
                          />
                        ))}
                        {showNow && (
                          <span
                            className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-white/70"
                            style={{ left: `${nowPct}%` }}
                          />
                        )}
                        {rowResos.map((r) => {
                          const start = Math.max(
                            startMin,
                            Math.min(
                              endMin,
                              alignToWindow(toMin(r.time.slice(0, 5)), {
                                start: startMin,
                                end: endMin,
                              }),
                            ),
                          );
                          const leftPct = ((start - startMin) / rangeMin) * 100;
                          const widthPct = Math.min(100 - leftPct, (dur / rangeMin) * 100);
                          const dragging = draggingId === r.id;
                          const meta = STATUS_META[r.status];
                          return (
                            <div
                              key={r.id}
                              data-reservation-block
                              role="button"
                              tabIndex={0}
                              onClick={() => onSelect(r.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  onSelect(r.id);
                                }
                              }}
                              className={cn(
                                "group absolute top-1.5 bottom-1.5 flex touch-none select-none items-center gap-1 overflow-hidden rounded-lg border pl-0.5 pr-2 text-left transition-shadow",
                                meta.block,
                                // While airborne the block must not absorb the
                                // hit-test that finds the row underneath it.
                                dragging
                                  ? "pointer-events-none z-30 opacity-90 shadow-elevated will-change-transform"
                                  : "cursor-pointer hover:shadow-elevated",
                                dragging && dragTarget && !dragTarget.valid && "ring-2 ring-danger",
                                selectedId === r.id &&
                                  "ring-2 ring-white ring-offset-1 ring-offset-surface-1",
                              )}
                              style={{
                                left: `${leftPct}%`,
                                width: `calc(${widthPct}% - 4px)`,
                              }}
                            >
                              <span
                                role="button"
                                tabIndex={-1}
                                aria-label={`Drag ${r.guestName}'s reservation`}
                                onPointerDown={(e) => onHandlePointerDown(e, r)}
                                onClick={(e) => e.stopPropagation()}
                                className="flex h-full w-3.5 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground opacity-40 transition group-hover:opacity-100 active:cursor-grabbing"
                              >
                                <GripVertical className="h-3 w-3" />
                              </span>
                              <span className="flex min-w-0 flex-1 flex-col justify-center">
                                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                                  <span
                                    className={cn("h-1.5 w-1.5 shrink-0 rounded-full", meta.dot)}
                                  />
                                  {r.isPriorityReservation && (
                                    <Star
                                      className="h-2.5 w-2.5 shrink-0 fill-current text-white"
                                      aria-label="Priority reservation"
                                    />
                                  )}
                                  <span className="truncate">{r.guestName}</span>
                                </span>
                                <span className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                                  <span className="inline-flex items-center gap-0.5">
                                    <Users className="h-2.5 w-2.5" /> {r.partySize}
                                  </span>
                                  <span className="inline-flex items-center gap-0.5">
                                    <Clock className="h-2.5 w-2.5" /> {r.time.slice(0, 5)}
                                  </span>
                                </span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  tone?: "white";
}) {
  return (
    <div className="dash-card flex items-center gap-3 rounded-2xl border border-white/5 bg-surface-1 p-4">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
          tone === "white"
            ? "border-white/20 bg-white/10 text-white"
            : "border-white/10 bg-background text-muted-foreground",
        )}
      >
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0">
        <div className="font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="mt-0.5 text-2xl font-semibold tabular-nums leading-none">{value}</div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-background px-2.5 py-1.5">
      <dt className="font-jetbrains-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-sm font-medium">{value}</dd>
    </div>
  );
}
