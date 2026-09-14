export type RefundState = "none" | "partial" | "full";

const num = (v: string | number | null | undefined): number => {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export const toCents = (v: string | number | null | undefined): number => Math.round(num(v) * 100);

export const fromCents = (cents: number): number => cents / 100;

export function refundStateOf(
  paidAmount: string | number | null | undefined,
  refundedAmount: string | number | null | undefined,
): RefundState {
  const paid = toCents(paidAmount);
  const refunded = toCents(refundedAmount);
  if (refunded <= 0) return "none";
  return refunded >= paid ? "full" : "partial";
}

export function refundableCents(
  paidAmount: string | number | null | undefined,
  refundedAmount: string | number | null | undefined,
): number {
  return Math.max(0, toCents(paidAmount) - toCents(refundedAmount));
}

export const REFUND_ERRORS = {
  nothingPaid: "This booking has no captured payment to refund.",
  fullyRefunded: "This booking has already been fully refunded.",
  notPositive: "Enter a refund amount greater than zero.",
  tooLarge: "That is more than the remaining refundable amount.",
  noPaymentIntent:
    "This booking has no Stripe payment on file, so it can't be refunded automatically.",
} as const;

export type RefundAmountCheck =
  { ok: true; cents: number; state: RefundState } | { ok: false; error: string };

export function checkRefundAmount(
  requested: string | number | null | undefined,
  paidAmount: string | number | null | undefined,
  refundedAmount: string | number | null | undefined,
): RefundAmountCheck {
  const paid = toCents(paidAmount);
  if (paid <= 0) return { ok: false, error: REFUND_ERRORS.nothingPaid };

  const remaining = refundableCents(paidAmount, refundedAmount);
  if (remaining <= 0) return { ok: false, error: REFUND_ERRORS.fullyRefunded };

  const cents = toCents(requested);
  if (cents <= 0) return { ok: false, error: REFUND_ERRORS.notPositive };
  if (cents > remaining) return { ok: false, error: REFUND_ERRORS.tooLarge };

  const refundedAfter = toCents(refundedAmount) + cents;
  return {
    ok: true,
    cents,
    state: refundedAfter >= paid ? "full" : "partial",
  };
}

export const centsToNumeric = (cents: number): string => (cents / 100).toFixed(2);

export const REFUND_STATE_LABEL: Record<RefundState, string> = {
  none: "Paid",
  partial: "Partially refunded",
  full: "Refunded",
};
