import { ReservationPaymentStatus, ReservationStatus } from "@/drizzle/schemas/reservation-schema";
import { refundStateOf } from "@/lib/reservations/refunds";

export const STATUS_META: Record<ReservationStatus, { label: string; cls: string; dot: string }> = {
  pending: {
    label: "Pending",
    cls: "bg-warning/15 text-warning border-warning/30",
    dot: "bg-warning",
  },
  confirmed: { label: "Confirmed", cls: "bg-info/15 text-info border-info/30", dot: "bg-info" },
  seated: {
    label: "Seated",
    cls: "bg-success/15 text-success border-success/30",
    dot: "bg-success",
  },
  completed: { label: "Completed", cls: "bg-white/15 text-white border-white/30", dot: "bg-white" },
  no_show: { label: "No-show", cls: "bg-danger/15 text-danger border-danger/30", dot: "bg-danger" },
  cancelled: {
    label: "Cancelled",
    cls: "bg-muted/40 text-muted-foreground border-white/10",
    dot: "bg-muted-foreground",
  },
};

export const PAYMENT_META: Record<ReservationPaymentStatus, { label: string; cls: string }> = {
  free: { label: "No deposit", cls: "bg-muted/40 text-muted-foreground border-white/10" },
  pending: { label: "Payment pending", cls: "bg-warning/15 text-warning border-warning/30" },
  paid: { label: "Paid", cls: "bg-success/15 text-success border-success/30" },
  failed: { label: "Failed", cls: "bg-danger/15 text-danger border-danger/30" },
};

export function paymentBadge(row: {
  paymentStatus: ReservationPaymentStatus;
  paidAmount?: string | null;
  refundedAmount?: string | null;
}): { label: string; cls: string } {
  if (row.paymentStatus === "paid") {
    const state = refundStateOf(row.paidAmount, row.refundedAmount);
    if (state === "full") {
      return { label: "Refunded", cls: "bg-danger/15 text-danger border-danger/30" };
    }
    if (state === "partial") {
      return { label: "Part refunded", cls: "bg-warning/15 text-warning border-warning/30" };
    }
  }
  return PAYMENT_META[row.paymentStatus];
}

export const TERMINAL_STATUSES: ReservationStatus[] = ["completed", "cancelled", "no_show"];

export const isTerminalStatus = (status: ReservationStatus) => TERMINAL_STATUSES.includes(status);

export const TERMINAL_STATUS_COPY: Record<string, string> = {
  completed: "Completed reservations can't be reopened.",
  cancelled: "Cancelled reservations can't be reopened.",
  no_show: "No-show reservations can't be reopened.",
};
