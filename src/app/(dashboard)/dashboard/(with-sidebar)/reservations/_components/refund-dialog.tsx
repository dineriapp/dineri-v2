"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRefundReservation } from "@/lib/tanstack-react-query/hooks/reservation-payments";
import { checkRefundAmount, refundableCents } from "@/lib/reservations/refunds";
import { cn } from "@/lib/utils";
import { fmtMoney } from "@/lib/stripe/types";
import { AlertTriangle, Loader2, Undo2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export type RefundTarget = {
  id: string;
  guestName: string;
  paidAmount: string;
  refundedAmount: string;
  currency?: string | null;
};

export function RefundDialog({
  target,
  open,
  onOpenChange,
  onRefunded,
}: {
  target: RefundTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefunded?: () => void;
}) {
  const refundMutation = useRefundReservation();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const remaining = target ? refundableCents(target.paidAmount, target.refundedAmount) / 100 : 0;
  const alreadyRefunded = Number(target?.refundedAmount ?? 0);
  const money = (n: number) => fmtMoney(n, target?.currency);

  useEffect(() => {
    if (open && target) {
      setAmount(remaining.toFixed(2));
      setReason("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, target]);

  if (!target) return null;

  const check = checkRefundAmount(amount, target.paidAmount, target.refundedAmount);
  const invalid = !check.ok && amount.trim() !== "";

  const submit = () => {
    if (!check.ok) {
      toast.error(check.error);
      return;
    }

    refundMutation.mutate(
      { reservationId: target.id, amount: check.cents / 100, reason: reason.trim() || undefined },
      {
        onSuccess: (data) => {
          toast.success(`${money(check.cents / 100)} refunded to ${target.guestName}`, {
            description: `Stripe refund ${data.refundReference}`,
          });
          onOpenChange(false);
          onRefunded?.();
        },
        onError: (err) => toast.error(err.message ?? "Failed to issue refund"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Undo2 className="h-4 w-4" /> Refund {target.guestName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-background p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Collected</span>
              <span className="font-semibold tabular-nums">{money(Number(target.paidAmount))}</span>
            </div>
            {alreadyRefunded > 0 && (
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-muted-foreground">Already refunded</span>
                <span className="font-semibold tabular-nums text-warning">
                  −{money(alreadyRefunded)}
                </span>
              </div>
            )}
            <div className="mt-1.5 flex items-center justify-between border-t border-white/5 pt-1.5">
              <span className="text-muted-foreground">Refundable now</span>
              <span className="font-semibold tabular-nums">{money(remaining)}</span>
            </div>
          </div>

          <div>
            <label htmlFor="refund-amount" className="mb-1.5 block text-xs text-muted-foreground">
              Refund amount
            </label>
            <input
              id="refund-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              max={remaining}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={cn(
                "w-full rounded-lg border bg-background px-3 py-2 text-base tabular-nums focus:outline-none sm:text-sm",
                invalid
                  ? "border-danger/50 focus:border-danger"
                  : "border-white/10 focus:border-white/50",
              )}
            />
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <p className={cn("text-[11px]", invalid ? "text-danger" : "text-muted-foreground")}>
                {invalid ? check.error : "Enter less than the full amount for a partial refund."}
              </p>
              {Number(amount) !== remaining && remaining > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(remaining.toFixed(2))}
                  className="shrink-0 text-[11px] text-white underline-offset-2 hover:underline"
                >
                  Refund all
                </button>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="refund-reason" className="mb-1.5 block text-xs text-muted-foreground">
              Reason <span className="text-muted-foreground/60">(optional)</span>
            </label>
            <input
              id="refund-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Cancelled within policy, goodwill, duplicate charge…"
              maxLength={200}
              className="w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-base placeholder:text-muted-foreground/60 focus:border-white/50 focus:outline-none sm:text-sm"
            />
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3 text-[11px] text-warning">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              This moves real money through Stripe and can&apos;t be undone. The guest is emailed a
              refund confirmation.
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={!check.ok || refundMutation.isPending}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-background transition hover:bg-white/90 disabled:opacity-50"
            >
              {refundMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Undo2 className="h-3.5 w-3.5" />
              )}
              {refundMutation.isPending
                ? "Refunding…"
                : `Refund ${check.ok ? money(check.cents / 100) : ""}`}
            </button>
            <button
              onClick={() => onOpenChange(false)}
              disabled={refundMutation.isPending}
              className="rounded-xl border border-white/10 bg-background px-3 py-2.5 text-xs hover:border-white/20 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
