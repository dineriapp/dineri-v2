"use client";

import { Calendar } from "@/components/ui/calendar";
import Loader from "@/components/ui/loader";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ReservationPaymentStatus } from "@/drizzle/schemas/reservation-schema";
import { canRefund } from "@/lib/reservations/refunds";
import {
  useReservationPaymentsPage,
  useReservationPaymentsSummary,
} from "@/lib/tanstack-react-query/hooks/reservation-payments";
import { cn } from "@/lib/utils";
import { useSelectedRestaurant } from "@/stores/restaurant-store";
import { endOfMonth, format, startOfMonth } from "date-fns";
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock,
  CreditCard,
  Download,
  Eye,
  Loader2,
  MapPin,
  Percent,
  Receipt,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Undo2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { StatCard } from "../../../../_components";
import { fmtMoney } from "../../../orders/_components/utils";
import { paymentBadge } from "../dashboard/status-meta";
import { PriorityBadge } from "../priority-badge";
import { RefundDialog } from "../refund-dialog";
import { exportReservationPaymentsAction, ReservationPaymentRow } from "./actions";
import { PaymentDetailDialog } from "./payment-detail-dialog";

const PAGE_SIZE = 25;

type RangeId = "today" | "date" | "month";

const iso = (d: Date) => format(d, "yyyy-MM-dd");

function resolveBounds(range: RangeId, day: Date, month: Date): { from: string; to: string } {
  switch (range) {
    case "today": {
      const now = new Date();
      return { from: iso(now), to: iso(now) };
    }
    case "date":
      return { from: iso(day), to: iso(day) };
    case "month":
      return { from: iso(startOfMonth(month)), to: iso(endOfMonth(month)) };
  }
}

export function PaymentsTab() {
  const [range, setRange] = useState<RangeId>("today");
  const [day, setDay] = useState<Date>(() => new Date());
  const [month, setMonth] = useState<Date>(() => new Date());
  const [dayOpen, setDayOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [detailPayment, setDetailPayment] = useState<ReservationPaymentRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [refundTarget, setRefundTarget] = useState<ReservationPaymentRow | null>(null);
  const [exporting, setExporting] = useState(false);

  const restaurant = useSelectedRestaurant();
  const currency = restaurant?.stripe?.currency ?? null;

  const bounds = useMemo(() => resolveBounds(range, day, month), [range, day, month]);

  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const pageIndex = cursorStack.length - 1;
  const currentCursor = cursorStack[pageIndex];

  useEffect(() => {
    setCursorStack([null]);
  }, [bounds.from, bounds.to]);

  const { data: summary, isPending: summaryPending } = useReservationPaymentsSummary(bounds);
  const {
    data: page,
    isPending: listPending,
    isPlaceholderData: isStale,
  } = useReservationPaymentsPage(bounds, currentCursor);

  const rows = page?.rows ?? [];
  const money = (n: number) => fmtMoney(n, currency);

  const openDetail = (r: ReservationPaymentRow) => {
    setDetailPayment(r);
    setDetailOpen(true);
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const result = await exportReservationPaymentsAction(bounds);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const url = URL.createObjectURL(
        new Blob([result.data.csv], { type: "text/csv;charset=utf-8;" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = result.data.filename;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Payments exported");
    } catch {
      toast.error("Failed to export payments");
    } finally {
      setExporting(false);
    }
  };

  const pageStart = rows.length ? pageIndex * PAGE_SIZE + 1 : 0;
  const pageEnd = pageIndex * PAGE_SIZE + rows.length;

  const rangeLabel =
    range === "today"
      ? "Today"
      : range === "date"
        ? format(day, "EEE, MMM d, yyyy")
        : format(month, "MMMM yyyy");

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Money */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Collected"
          value={summaryPending ? "—" : money(summary?.collected ?? 0)}
          icon={TrendingUp}
          tone="white"
          hint={summary ? `${summary.counts.paid} paid · gross` : undefined}
        />
        <StatCard
          label="Awaiting payment"
          value={summaryPending ? "—" : money(summary?.pending ?? 0)}
          icon={Receipt}
          tone="amber"
          hint={summary ? `${summary.counts.pending} pending` : undefined}
        />
        <StatCard
          label="Refunded"
          value={summaryPending ? "—" : money(summary?.refunded ?? 0)}
          icon={Undo2}
          hint={
            summary
              ? `${summary.counts.refunded} full · ${summary.counts.partiallyRefunded} partial`
              : undefined
          }
        />
        <StatCard
          label="Net"
          value={summaryPending ? "—" : money(summary?.net ?? 0)}
          icon={CircleDollarSign}
          hint="collected − refunded"
        />
      </div>

      {/* Cancellations, no-shows and abandoned checkouts */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Kept from lost covers"
          value={summaryPending ? "—" : money(summary?.retainedFromLostCovers ?? 0)}
          icon={ShieldCheck}
          hint={
            summary
              ? `${summary.counts.cancelled} cancelled · ${summary.counts.noShow} no-show`
              : undefined
          }
        />
        <StatCard
          label="Lost to cancellations"
          value={summaryPending ? "—" : money(summary?.refundedOnCancellations ?? 0)}
          icon={TrendingDown}
          hint={summary ? `${summary.coversLost} covers lost` : undefined}
        />
        <StatCard
          label="Abandoned checkouts"
          value={summaryPending ? "—" : money(summary?.abandoned ?? 0)}
          icon={AlertTriangle}
          hint={
            summary ? `${summary.counts.failed} never paid · not counted as revenue` : undefined
          }
        />
        <StatCard
          label="Average deposit"
          value={summaryPending ? "—" : money(summary?.averageDeposit ?? 0)}
          icon={Percent}
          hint={
            summary
              ? `${summary.rates.refund.toFixed(0)}% refunded · ${summary.rates.cancellation.toFixed(0)}% cancelled`
              : undefined
          }
        />
      </div>

      {/* Range filter */}
      <div className="dash-card flex flex-wrap items-center gap-2 rounded-2xl border border-white/5 bg-surface-1 p-3">
        <span className="font-jetbrains-mono mr-1 hidden text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
          Period
        </span>

        <button
          onClick={() => setRange("today")}
          className={cn(
            "inline-flex h-9 items-center rounded-full border px-3.5 text-xs font-medium transition",
            range === "today"
              ? "border-white/50 bg-white text-background shadow-[0_6px_18px_-8px_rgba(255,255,255,0.6)]"
              : "border-white/10 bg-background text-muted-foreground hover:border-white/20 hover:text-foreground",
          )}
        >
          Today
        </button>

        {/* Specific date */}
        <Popover open={dayOpen} onOpenChange={setDayOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition",
                range === "date"
                  ? "border-white/50 bg-white text-background"
                  : "border-white/10 bg-background text-muted-foreground hover:border-white/20 hover:text-foreground",
              )}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              {range === "date" ? format(day, "MMM d, yyyy") : "Pick a date"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={range === "date" ? day : undefined}
              onSelect={(d) => {
                if (d) {
                  setDay(d);
                  setRange("date");
                  setDayOpen(false);
                }
              }}
              autoFocus
            />
          </PopoverContent>
        </Popover>

        {/* Month */}
        <Popover open={monthOpen} onOpenChange={setMonthOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition",
                range === "month"
                  ? "border-white/50 bg-white text-background"
                  : "border-white/10 bg-background text-muted-foreground hover:border-white/20 hover:text-foreground",
              )}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              {range === "month" ? format(month, "MMMM yyyy") : "Pick a month"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <MonthPicker
              value={month}
              onSelect={(d) => {
                setMonth(d);
                setRange("month");
                setMonthOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>

        <button
          onClick={exportCsv}
          disabled={exporting}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-background px-3.5 text-xs font-medium text-muted-foreground transition hover:border-white/20 hover:text-foreground disabled:opacity-50"
        >
          {exporting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Export CSV
        </button>

        <span className="ml-auto text-[11px] text-muted-foreground">
          {summaryPending ? "…" : `${summary?.counts.total ?? 0} reservations`} · {rangeLabel}
        </span>
      </div>

      {/* Transactions */}
      <div
        className={cn(
          "dash-card overflow-hidden rounded-2xl border border-white/5 bg-surface-1 transition-opacity",
          isStale && "opacity-60",
        )}
      >
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
          <h3 className="text-sm font-semibold">Transactions</h3>
          <span className="font-jetbrains-mono text-[10px] uppercase text-muted-foreground">
            {rows.length === 0 ? "no entries" : `${pageStart}-${pageEnd}`}
          </span>
        </div>

        {listPending ? (
          <Loader className="min-h-60" />
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-14 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-background text-muted-foreground">
              <CreditCard className="h-4 w-4 opacity-60" />
            </div>
            <div className="text-xs text-muted-foreground">No reservations in this period.</div>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {rows.map((r) => {
              const meta = paymentBadge({
                paymentStatus: r.paymentStatus as ReservationPaymentStatus,
                paidAmount: r.paidAmount,
                refundedAmount: r.refundedAmount,
              }) ?? {
                label: r.paymentStatus,
                cls: "bg-muted/40 text-muted-foreground border-white/10",
              };
              const rowMoney = (n: number) => fmtMoney(n, r.currency ?? currency);
              const refunded = Number(r.refundedAmount);
              return (
                <div
                  key={r.id}
                  className="flex flex-col gap-3 px-4 py-3 transition hover:bg-background/40 sm:flex-row sm:items-center"
                >
                  {/* Guest + booking */}
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-background text-muted-foreground">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{r.guestName}</span>
                        {r.isPriorityReservation && <PriorityBadge />}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {format(new Date(`${r.date}T00:00:00`), "MMM d, yyyy")}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {r.time.slice(0, 5)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" /> {r.partySize}
                        </span>
                        {r.areaName && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {r.areaName}
                            {r.tables.length > 0 && ` · ${r.tables.join(", ")}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status + amount, right-aligned and read-only */}
                  <div className="flex shrink-0 items-center justify-end gap-3 pl-12 sm:pl-0">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider",
                        meta.cls,
                      )}
                    >
                      {meta.label}
                    </span>
                    <div className="min-w-24 text-right">
                      <div
                        className={cn(
                          "font-inter-tight text-sm font-semibold tabular-nums",
                          Number(r.paidAmount) === 0 && "text-muted-foreground",
                        )}
                      >
                        {rowMoney(Number(r.paymentStatus === "paid" ? r.paidAmount : r.amount))}
                      </div>
                      {refunded > 0 && (
                        <div className="text-[10px] tabular-nums text-warning">
                          −{rowMoney(refunded)} refunded
                        </div>
                      )}
                    </div>
                    {canRefund(r) && (
                      <button
                        onClick={() => setRefundTarget(r)}
                        className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-background px-2 text-[11px] text-muted-foreground hover:border-white/20 hover:text-foreground"
                        aria-label={`Refund ${r.guestName}`}
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Refund</span>
                      </button>
                    )}
                    <button
                      onClick={() => openDetail(r)}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-background text-muted-foreground hover:border-white/20 hover:text-foreground"
                      aria-label="View payment details"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {(rows.length > 0 || pageIndex > 0) && (
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
            onClick={() => page?.nextCursor && setCursorStack((p) => [...p, page.nextCursor])}
            disabled={!page?.nextCursor}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-background px-3 text-xs text-muted-foreground transition hover:border-white/20 hover:text-foreground disabled:opacity-40"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <PaymentDetailDialog open={detailOpen} setOpen={setDetailOpen} payment={detailPayment} />

      <RefundDialog
        open={!!refundTarget}
        onOpenChange={(open) => !open && setRefundTarget(null)}
        target={
          refundTarget && {
            id: refundTarget.id,
            guestName: refundTarget.guestName,
            paidAmount: refundTarget.paidAmount,
            refundedAmount: refundTarget.refundedAmount,
            currency: refundTarget.currency ?? currency,
          }
        }
      />
    </div>
  );
}

/** Year stepper + month grid - the shadcn Calendar only picks days. */
function MonthPicker({ value, onSelect }: { value: Date; onSelect: (d: Date) => void }) {
  const [year, setYear] = useState(() => value.getFullYear());
  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

  return (
    <div className="w-64 p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={() => setYear((y) => y - 1)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
          aria-label="Previous year"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="text-sm font-semibold tabular-nums">{year}</span>
        <button
          onClick={() => setYear((y) => y + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
          aria-label="Next year"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {months.map((m) => {
          const active =
            m.getFullYear() === value.getFullYear() && m.getMonth() === value.getMonth();
          return (
            <button
              key={m.getMonth()}
              onClick={() => onSelect(m)}
              className={cn(
                "rounded-md px-2 py-1.5 text-xs transition",
                active
                  ? "bg-white font-semibold text-background"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {format(m, "MMM")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
