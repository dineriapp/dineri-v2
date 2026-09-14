"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReservationPaymentStatus, ReservationStatus } from "@/drizzle/schemas/reservation-schema";
import { useSelectedRestaurant } from "@/stores/restaurant-store";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Clock,
  CreditCard,
  Hash,
  Mail,
  MapPin,
  Phone,
  StickyNote,
  Undo2,
  Users,
} from "lucide-react";
import { fmtMoney } from "../../../orders/_components/utils";
import { paymentBadge } from "../dashboard/status-meta";
import { PriorityBadge } from "../priority-badge";
import { ReservationPaymentRow } from "./actions";
import { cn } from "@/lib/utils";

const STATUS_META: Record<ReservationStatus, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-warning/15 text-warning border-warning/30" },
  confirmed: { label: "Confirmed", cls: "bg-info/15 text-info border-info/30" },
  seated: { label: "Seated", cls: "bg-success/15 text-success border-success/30" },
  completed: { label: "Completed", cls: "bg-white/15 text-white border-white/30" },
  no_show: { label: "No-show", cls: "bg-danger/15 text-danger border-danger/30" },
  cancelled: { label: "Cancelled", cls: "bg-muted/40 text-muted-foreground border-white/10" },
};

const Badge = ({ label, cls }: { label: string; cls: string }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider",
      cls,
    )}
  >
    {label}
  </span>
);

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
    <div className="mt-1 truncate text-sm font-medium">{value}</div>
  </div>
);

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  payment: ReservationPaymentRow | null;
};

export function PaymentDetailDialog({ open, setOpen, payment }: Props) {
  const restaurant = useSelectedRestaurant();

  if (!payment) return null;

  const statusMeta = STATUS_META[payment.status as ReservationStatus] ?? {
    label: payment.status,
    cls: "bg-muted/40 text-muted-foreground border-white/10",
  };
  const paymentMeta = paymentBadge({
    paymentStatus: payment.paymentStatus as ReservationPaymentStatus,
    paidAmount: payment.paidAmount,
    refundedAmount: payment.refundedAmount,
  }) ?? {
    label: payment.paymentStatus,
    cls: "bg-muted/40 text-muted-foreground border-white/10",
  };

  const money = (n: number) => fmtMoney(n, payment.currency ?? restaurant?.stripe?.currency);
  const refunded = Number(payment.refundedAmount);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Payment details
            {payment.isPriorityReservation && <PriorityBadge />}
          </DialogTitle>
          <DialogDescription>
            Guest, reservation and payment information for this transaction.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 pb-1">
          <Badge label={statusMeta.label} cls={statusMeta.cls} />
          <Badge label={paymentMeta.label} cls={paymentMeta.cls} />
        </div>

        <div className="grid gap-3 py-1 sm:grid-cols-2">
          <ReadOnly icon={Users} label="Guest" value={payment.guestName} />
          <ReadOnly icon={Users} label="Party size" value={`${payment.partySize} guests`} />
          <ReadOnly icon={Phone} label="Phone" value={payment.guestPhone} />
          <ReadOnly icon={Mail} label="Email" value={payment.guestEmail} />
          <ReadOnly
            icon={CalendarIcon}
            label="Date"
            value={format(new Date(`${payment.date}T00:00:00`), "MMM d, yyyy")}
          />
          <ReadOnly icon={Clock} label="Time" value={payment.time.slice(0, 5)} />
          <ReadOnly
            icon={MapPin}
            label="Area"
            value={
              payment.areaName
                ? payment.tables.length > 0
                  ? `${payment.areaName} · ${payment.tables.join(", ")}`
                  : payment.areaName
                : "Awaiting seating"
            }
          />
          <ReadOnly
            icon={CreditCard}
            label={payment.paymentStatus === "paid" ? "Collected" : "Deposit quoted"}
            value={money(
              Number(payment.paymentStatus === "paid" ? payment.paidAmount : payment.amount),
            )}
          />
          {refunded > 0 && (
            <>
              <ReadOnly icon={Undo2} label="Refunded" value={money(refunded)} />
              <ReadOnly
                icon={CreditCard}
                label="Net kept"
                value={money(Number(payment.paidAmount) - refunded)}
              />
              {payment.refundedAt && (
                <ReadOnly
                  icon={Clock}
                  label="Refunded on"
                  value={format(new Date(payment.refundedAt), "MMM d, yyyy 'at' h:mm a")}
                />
              )}
              {payment.refundReason && (
                <ReadOnly icon={StickyNote} label="Refund reason" value={payment.refundReason} />
              )}
            </>
          )}
          {payment.paymentReference && (
            <ReadOnly icon={Hash} label="Payment reference" value={payment.paymentReference} />
          )}
          {payment.note && (
            <div className="sm:col-span-2">
              <ReadOnly icon={StickyNote} label="Notes" value={payment.note} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
