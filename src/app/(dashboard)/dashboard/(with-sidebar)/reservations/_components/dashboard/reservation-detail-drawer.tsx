"use client";

import { reservationReference } from "@/components/shared/reservation-ticket";
import { ReservationStatus } from "@/drizzle/schemas/reservation-schema";
import { ReservationWithArea } from "@/drizzle/types";
import { canRefund, refundableCents, refundStateOf } from "@/lib/reservations/refunds";
import { useUpdateReservationStatus } from "@/lib/tanstack-react-query/hooks/reservation-dashboard";
import { cn } from "@/lib/utils";
import { useSelectedRestaurant } from "@/stores/restaurant-store";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Check,
  Clock,
  CreditCard,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Printer,
  StickyNote,
  Undo2,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashSelect } from "../../../../_components";
import { PriorityBadge } from "../priority-badge";
import { RefundDialog } from "../refund-dialog";
import { fmtMoney } from "../../../orders/_components/utils";
import { isTerminalStatus, paymentBadge, STATUS_META, TERMINAL_STATUS_COPY } from "./status-meta";

const STATUS_OPTIONS: { value: ReservationStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "seated", label: "Seated" },
  { value: "completed", label: "Completed" },
  { value: "no_show", label: "No-show" },
  { value: "cancelled", label: "Cancelled" },
];

const TIMELINE: { status: ReservationStatus; label: string }[] = [
  { status: "pending", label: "Booked" },
  { status: "confirmed", label: "Confirmed" },
  { status: "seated", label: "Seated" },
  { status: "completed", label: "Completed" },
];

export function ReservationDetailDrawer({
  reservation,
  onClose,
}: {
  reservation: ReservationWithArea;
  onClose: () => void;
}) {
  const restaurant = useSelectedRestaurant();
  const updateMutation = useUpdateReservationStatus();
  const [status, setStatus] = useState<ReservationStatus>(reservation.status);
  const [refundOpen, setRefundOpen] = useState(false);

  const money = (n: number) =>
    fmtMoney(n, reservation.currency ?? restaurant?.stripe?.currency ?? null);

  useEffect(() => {
    setStatus(reservation.status);
  }, [reservation]);

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const statusMeta = STATUS_META[reservation.status];
  const paymentMeta = paymentBadge(reservation);

  const statusLocked = isTerminalStatus(reservation.status);

  const isFree = reservation.paymentStatus === "free";
  const refundable = refundableCents(reservation.paidAmount, reservation.refundedAmount) / 100;
  // Refunds are offered on cancelled bookings only.
  const refundAllowed = canRefund(reservation);
  const refundState = refundStateOf(reservation.paidAmount, reservation.refundedAmount);

  const dirty = status !== reservation.status;

  const currentIdx = TIMELINE.findIndex((t) => t.status === reservation.status);
  const offTimeline = currentIdx === -1;

  const initials = reservation.guestName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  const save = () => {
    // Cancelling is the moment a deposit becomes refundable, so offer it right
    // away. Tested against the status the booking is about to have, and through
    // the same rule the button uses, so the dialog can never open on something
    // the refund action would then refuse.
    const cancellingWithMoney =
      status === "cancelled" &&
      reservation.status !== "cancelled" &&
      canRefund({ ...reservation, status: "cancelled" });

    updateMutation.mutate(
      { id: reservation.id, status, paymentStatus: reservation.paymentStatus },
      {
        onSuccess: () => {
          if (cancellingWithMoney) {
            toast.success("Reservation cancelled", {
              description: `${money(refundable)} is still held for this booking.`,
            });
            setRefundOpen(true);
            return;
          }
          toast.success("Reservation updated");
          onClose();
        },
        onError: (err) => toast.error(err.message ?? "Failed to update reservation"),
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 animate-fade-in bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="animate-slide-in-right relative flex h-full w-full max-w-md flex-col border-l border-white/10 bg-surface-1 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/5 p-4 sm:p-6">
          <div className="min-w-0">
            <div className="font-jetbrains-mono text-[10px] uppercase text-muted-foreground">
              Reservation detail
            </div>
            <h3 className="mt-1 flex items-center gap-2 font-inter-tight text-xl font-semibold">
              <span className="truncate">{reservation.guestName}</span>
              {reservation.isPriorityReservation && <PriorityBadge />}
            </h3>
            <div className="mt-1 text-xs text-muted-foreground">
              {reservationReference(reservation.id)} ·{" "}
              {format(new Date(`${reservation.date}T00:00:00`), "EEE, MMM d")} at{" "}
              {reservation.time.slice(0, 5)}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 p-1.5 hover:border-white/20"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Status + payment badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${statusMeta.cls}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
              {statusMeta.label}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${paymentMeta.cls}`}
            >
              <CreditCard className="h-3 w-3" /> {paymentMeta.label}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
              <Users className="h-3 w-3" /> {reservation.partySize} guests
            </span>
          </div>

          {/* Progress */}
          {!offTimeline && (
            <div className="mt-5 rounded-xl border border-white/5 bg-background p-4">
              <div className="font-jetbrains-mono mb-3 text-[10px] uppercase text-muted-foreground">
                Progress
              </div>
              <ol className="flex items-center justify-between">
                {TIMELINE.map((t, i) => {
                  const done = i <= currentIdx;
                  const active = i === currentIdx;
                  return (
                    <li key={t.status} className="flex flex-1 items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold ${done ? "border-white bg-white text-background" : "border-white/10 bg-background text-muted-foreground"} ${active ? "ring-2 ring-white/40" : ""}`}
                        >
                          {done ? <Check className="h-3 w-3" /> : i + 1}
                        </div>
                        <span
                          className={`mt-1 text-[10px] ${done ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          {t.label}
                        </span>
                      </div>
                      {i < TIMELINE.length - 1 && (
                        <div
                          className={`mx-1 h-px flex-1 ${i < currentIdx ? "bg-white" : "bg-white/10"}`}
                        />
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {/* Guest */}
          <div className="mt-5 rounded-xl border border-white/5 bg-background p-4">
            <div className="font-jetbrains-mono text-[10px] uppercase text-muted-foreground">
              Guest
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{reservation.guestName}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {reservation.guestPhone}
                </div>
              </div>
              <a
                href={`tel:${reservation.guestPhone}`}
                className="rounded-lg border border-white/10 p-1.5 hover:border-white/20"
                aria-label="Call"
              >
                <Phone className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/5 bg-surface-1 p-2.5 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0 text-white" />
              <span className="truncate">{reservation.guestEmail}</span>
            </div>
          </div>

          {/* Booking */}
          <div className="mt-5 grid grid-cols-2 gap-2">
            <ReadOnly
              icon={CalendarIcon}
              label="Date"
              value={format(new Date(`${reservation.date}T00:00:00`), "EEE, MMM d, yyyy")}
            />
            <ReadOnly icon={Clock} label="Time" value={reservation.time.slice(0, 5)} />
            <ReadOnly
              icon={MapPin}
              label="Area"
              value={reservation.area?.name ?? "Awaiting seating"}
            />
            <ReadOnly
              icon={CreditCard}
              label={reservation.paymentStatus === "paid" ? "Collected" : "Deposit quoted"}
              value={money(
                Number(
                  reservation.paymentStatus === "paid"
                    ? reservation.paidAmount
                    : reservation.amount,
                ),
              )}
            />
            {refundState !== "none" && (
              <div className="col-span-2">
                <ReadOnly
                  icon={Undo2}
                  label={refundState === "full" ? "Refunded" : "Refunded (partial)"}
                  value={
                    money(Number(reservation.refundedAmount)) +
                    (reservation.refundReason ? ` · ${reservation.refundReason}` : "")
                  }
                />
              </div>
            )}
            {reservation.assignedTables.length > 0 && (
              <div className="col-span-2">
                <ReadOnly
                  icon={Users}
                  label="Tables"
                  value={reservation.assignedTables.map((t) => t.label).join(", ")}
                />
              </div>
            )}
            {reservation.note && (
              <div className="col-span-2">
                <ReadOnly icon={StickyNote} label="Notes" value={reservation.note} />
              </div>
            )}
          </div>

          {/* Editable fields */}
          <div className="mt-5 space-y-3 rounded-xl border border-white/5 bg-background p-4">
            <div className="font-jetbrains-mono text-[10px] uppercase text-muted-foreground">
              Update
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-muted-foreground">Status</label>
              <DashSelect
                value={status}
                onValueChange={(v) => setStatus(v as ReservationStatus)}
                size="md"
                className="w-full"
                options={STATUS_OPTIONS}
                disabled={statusLocked}
              />
              {statusLocked && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {TERMINAL_STATUS_COPY[reservation.status]}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-muted-foreground">Payment</label>
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-surface-1 px-3 py-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider",
                    paymentMeta.cls,
                  )}
                >
                  {paymentMeta.label}
                </span>
                <span className="font-inter-tight text-sm font-semibold tabular-nums">
                  {money(Number(isFree ? reservation.amount : reservation.paidAmount))}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {isFree
                  ? "No deposit was required for this booking."
                  : "Stripe keeps this in step with the actual payment - use Refund to move money back."}
              </p>
            </div>

            {refundAllowed && (
              <button
                onClick={() => setRefundOpen(true)}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-surface-1 px-4 py-2.5 text-xs font-semibold transition hover:border-white/30"
              >
                <Undo2 className="h-3.5 w-3.5" />
                Refund {money(refundable)}
              </button>
            )}
          </div>
        </div>

        {/* Sticky footer */}
        <div className="border-t border-white/10 bg-surface-1 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={save}
              disabled={!dirty || updateMutation.isPending}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-background transition hover:bg-white/90 disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Save changes
            </button>
            <Link
              href={`/reservation/${reservation.id}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-background px-3 py-2.5 text-xs hover:border-white/20"
              aria-label="Print reservation ticket"
              title="Print ticket"
            >
              <Printer className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-background px-3 py-2.5 text-xs hover:border-white/20"
            >
              Close
            </button>
          </div>
        </div>
      </aside>

      <RefundDialog
        open={refundOpen}
        onOpenChange={setRefundOpen}
        target={{
          id: reservation.id,
          guestName: reservation.guestName,
          paidAmount: reservation.paidAmount,
          refundedAmount: reservation.refundedAmount,
          currency: reservation.currency ?? restaurant?.stripe?.currency ?? null,
        }}
      />
    </div>
  );
}

const ReadOnly = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) => (
  <div className="rounded-lg border border-white/10 bg-background px-3 py-2">
    <div className="flex items-center gap-1.5 font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
      <Icon className="h-3 w-3" /> {label}
    </div>
    <div className="mt-1 text-sm font-medium wrap-break-word">{value}</div>
  </div>
);
