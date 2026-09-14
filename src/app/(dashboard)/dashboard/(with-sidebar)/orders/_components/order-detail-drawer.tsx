"use client";
import { OrderStatus } from "@/drizzle/schema";
import { OrderWithItems } from "@/drizzle/types";
import { formatOrderNumber } from "@/lib/utils";
import { Check, Phone, Printer, Truck, X, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { timeAgo } from "../../../_components";
import {
  channelIcon,
  fmtMoney,
  isOrderStatusEditable,
  nextStatusFor,
  paymentMethodLabel,
  paymentStatusStyles,
  statusMeta,
} from "./utils";

export const OrderDetailDrawer = ({
  order,
  onClose,
  onUpdateStatus,
}: {
  order: OrderWithItems;
  onClose: () => void;
  onUpdateStatus: (s: OrderStatus) => void;
}) => {
  const subtotal = order.subtotal;
  const Sicon = statusMeta[order.status].icon;
  const Cicon = channelIcon[order.fulfillment];
  const nextStatus = nextStatusFor(order.status);

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const timeline: { status: OrderStatus; label: string }[] = [
    { status: "new", label: "Placed" },
    { status: "confirmed", label: "Confirmed" },
    { status: "preparing", label: "Preparing" },
    { status: "ready", label: "Ready" },
    { status: "delivered", label: "Delivered" },
  ];
  const currentIdx = timeline.findIndex((t) => t.status === order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 animate-fade-in bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="animate-slide-in-right relative flex h-full w-full max-w-md flex-col border-l border-white/10 bg-surface-1 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/5 p-4 sm:p-6">
          <div>
            <div className="font-jetbrains-mono text-[10px] uppercase text-muted-foreground">
              Order detail
            </div>
            <h3 className="mt-1 font-inter-tight text-xl font-semibold">
              {formatOrderNumber(order.orderNumber)}
            </h3>
            <div className="mt-1 text-xs text-muted-foreground">
              Placed {timeAgo(String(order.createdAt))} · {paymentMethodLabel(order)} payment
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
          {/* Status + meta */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${statusMeta[order.status].cls}`}
            >
              <Sicon className="h-3 w-3" />
              {statusMeta[order.status].label}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-background px-2 py-0.5 text-[11px] capitalize text-muted-foreground">
              <Cicon className="h-3 w-3" /> {order.fulfillment}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] capitalize ${paymentStatusStyles[order.paymentStatus]}`}
            >
              {order.paymentStatus}
            </span>
          </div>

          {/* Timeline */}
          {!isCancelled && (
            <div className="mt-5 rounded-xl border border-white/5 bg-background p-4">
              <div className="font-jetbrains-mono mb-3 text-[10px] uppercase text-muted-foreground">
                Progress
              </div>
              <ol className="flex items-center justify-between">
                {timeline.map((t, i) => {
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
                      {i < timeline.length - 1 && (
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

          {/* Customer */}
          <div className="mt-5 rounded-xl border border-white/5 bg-background p-4">
            <div className="font-jetbrains-mono text-[10px] uppercase text-muted-foreground">
              Customer
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white">
                {order.name
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{order.name}</div>
                <div className="text-xs text-muted-foreground">{order.phone}</div>
              </div>
              <a
                href={`tel:${order.phone}`}
                className="rounded-lg border border-white/10 p-1.5 hover:border-white/20"
                aria-label="Call"
              >
                <Phone className="h-3.5 w-3.5" />
              </a>
            </div>
            {order.location && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-white/5 bg-surface-1 p-2.5 text-xs text-muted-foreground">
                <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white" />
                <span>{order.location}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <div className="font-jetbrains-mono text-[10px] uppercase text-muted-foreground">
                Items ({order.items.length})
              </div>
            </div>
            <ul className="mt-2 space-y-1.5">
              {order.items.map((it, i) => {
                const addons = it.addons;
                const hasAddons = addons && addons.length > 0;
                const hasCustomization = !!it.customization;
                return (
                  <li
                    key={i}
                    className="rounded-lg border border-white/5 bg-background px-3 py-2.5 text-sm"
                  >
                    {/* Main row: quantity, name, line total */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                          {it.quantity}×
                        </span>
                        <span>{it.itemName}</span>
                      </div>
                      <span className="tabular-nums font-medium">
                        {fmtMoney(Number(it.lineTotal), order.currency)}
                      </span>
                    </div>

                    {/* Add‑ons (if any) */}
                    {hasAddons && (
                      <div className="mt-1 text-xs text-muted-foreground pl-9">
                        Addons:{" "}
                        {addons.map((a, idx) => (
                          <span key={idx}>
                            {a.label} (+{fmtMoney(a.price, order.currency)})
                            {idx < addons.length - 1 && ", "}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Customization note (if any) */}
                    {hasCustomization && (
                      <div className="mt-0.5 text-xs italic text-muted-foreground pl-9">
                        “{it.customization}”
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Totals */}
            <div className="mt-3 space-y-1.5 rounded-xl border border-white/5 bg-background p-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums">{fmtMoney(Number(subtotal), order.currency)}</span>
              </div>

              <div className="flex justify-between border-t border-white/5 pt-1.5 text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums text-white">
                  {fmtMoney(Number(order.total), order.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="border-t border-white/10 bg-surface-1 p-4">
          <div className="flex flex-wrap items-center gap-2">
            {nextStatus && (
              <button
                onClick={() => onUpdateStatus(nextStatus)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-background transition hover:bg-white/90"
              >
                <Check className="h-3.5 w-3.5" /> Mark as {statusMeta[nextStatus].label}
              </button>
            )}
            <Link
              href={`/order/${order.id}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-background px-3 py-2.5 text-xs hover:border-white/20"
              aria-label="Print receipt"
            >
              <Printer className="h-3.5 w-3.5" />
            </Link>
            {isOrderStatusEditable(order.status) && (
              <button
                onClick={() => onUpdateStatus("cancelled")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2.5 text-xs text-danger hover:bg-danger/20"
              >
                <XCircle className="h-3.5 w-3.5" /> Cancel
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};
