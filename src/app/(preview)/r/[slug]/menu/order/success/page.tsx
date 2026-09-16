import { db } from "@/drizzle/db";
import { NO_INDEX } from "@/lib/seo";
import { getCurrencySymbol, StripeCurrency } from "@/lib/stripe/types";
import { orders } from "@/drizzle/schema";
import { formatOrderNumber } from "@/lib/utils";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import {
  ArrowRight,
  Check,
  Clock,
  CreditCard,
  Mail,
  MapPin,
  ShoppingBag,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import {
  lightStatusStyles,
  paymentMethodLabel,
  statusMeta,
} from "@/app/(dashboard)/dashboard/(with-sidebar)/orders/_components/utils";

import { venuePath } from "@/lib/venue-url";
export const metadata: Metadata = {
  title: "Order confirmed",
  description: "Your order confirmation.",
  robots: NO_INDEX,
};

const PAYMENT_STATUS_TEXT: Record<"pending" | "paid" | "failed" | "refunded", string> = {
  paid: "Paid",
  pending: "Finalizing payment…",
  failed: "Payment failed",
  refunded: "Refunded",
};

const money = (n: number, c?: string | null) =>
  `${getCurrencySymbol((c ?? undefined) as StripeCurrency | undefined)}${n.toFixed(2)}`;

async function getOrderBySession(sessionId: string, slug: string) {
  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.paymentReference, sessionId),
      with: {
        items: true,
        restaurant: { columns: { name: true, slug: true, logo: true } },
      },
    });
    if (!order || order.restaurant?.slug !== slug) return null;
    return order;
  } catch {
    return null;
  }
}

async function getOrderById(orderId: string, slug: string) {
  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        items: true,
        restaurant: { columns: { name: true, slug: true, logo: true } },
      },
    });
    if (!order || order.restaurant?.slug !== slug) return null;
    return order;
  } catch {
    return null;
  }
}

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ session_id?: string | string[]; order_id?: string | string[] }>;
};

const Page = async ({ params, searchParams }: Props) => {
  const { slug } = await params;
  const sp = await searchParams;
  const sessionId = Array.isArray(sp.session_id) ? sp.session_id[0] : sp.session_id;
  const orderId = Array.isArray(sp.order_id) ? sp.order_id[0] : sp.order_id;

  const order = sessionId
    ? await getOrderBySession(sessionId, slug)
    : orderId
      ? await getOrderById(orderId, slug)
      : null;
  const restaurantName = order?.restaurant?.name ?? "the restaurant";
  const logoUrl = (order?.restaurant?.logo as { url?: string } | null)?.url;
  const currency = order?.currency;
  const subtotal = order ? Number(order.subtotal) : 0;
  const total = order ? Number(order.total) : 0;
  const fees = Math.max(0, total - subtotal);
  const isDelivery = order?.fulfillment === "delivery";
  const FulfillIcon = isDelivery ? Truck : ShoppingBag;

  return (
    <main className="min-h-screen bg-linear-to-b from-zinc-50 to-zinc-100 px-4 py-10 text-zinc-900">
      <div className="mx-auto w-full max-w-lg">
        {/* Success header */}
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 ring-8 ring-emerald-50">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
              <Check className="h-7 w-7" strokeWidth={3} />
            </div>
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
            {order ? "Order confirmed" : "Thank you for your order"}
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
            {order
              ? `Thanks${order.name ? `, ${order.name.split(" ")[0]}` : ""}! We've received your order and ${restaurantName} is getting it ready.`
              : "Your order has been received. The restaurant will start preparing it shortly."}
          </p>
        </div>

        {/* Receipt card */}
        <div className="mt-8 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl shadow-zinc-900/5">
          {/* Card header */}
          <div className="flex items-center gap-3 border-b border-zinc-100 px-6 py-5">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={restaurantName}
                className="h-11 w-11 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{restaurantName}</div>
              {order && (
                <div className="text-xs text-zinc-500">
                  Order{" "}
                  <span className="font-medium text-zinc-700">
                    {formatOrderNumber(order.orderNumber)}
                  </span>
                </div>
              )}
            </div>
            {order && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${lightStatusStyles[order.status]}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {statusMeta[order.status].label}
              </span>
            )}
          </div>

          {order ? (
            <>
              {/* Meta */}
              <div className="grid grid-cols-2 gap-3 px-6 py-5">
                <Meta
                  icon={FulfillIcon}
                  label={isDelivery ? "Delivery" : "Pickup"}
                  value={isDelivery ? "To your address" : "Collect in store"}
                />
                <Meta icon={Clock} label="Status" value={statusMeta[order.status].label} />
                <Meta icon={CreditCard} label="Payment method" value={paymentMethodLabel(order)} />
                <Meta
                  icon={Check}
                  label="Payment status"
                  value={PAYMENT_STATUS_TEXT[order.paymentStatus]}
                />
                {order.location && (
                  <div className="col-span-2">
                    <Meta
                      icon={MapPin}
                      label={isDelivery ? "Deliver to" : "Location"}
                      value={order.location}
                    />
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="border-t border-zinc-100 px-6 py-5">
                <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Your order
                </div>
                <ul className="space-y-3">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 min-w-6 items-center justify-center rounded-md bg-zinc-100 px-1.5 text-xs font-semibold text-zinc-700">
                        {item.quantity}×
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{item.itemName}</div>
                        {item.addons && item.addons.length > 0 && (
                          <div className="text-xs text-zinc-500">
                            {item.addons.map((a) => a.label).join(", ")}
                          </div>
                        )}
                        {item.customization && (
                          <div className="text-xs italic text-zinc-400">“{item.customization}”</div>
                        )}
                      </div>
                      <div className="text-sm font-medium tabular-nums">
                        {money(Number(item.lineTotal), currency)}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Totals */}
              <div className="space-y-1.5 border-t border-zinc-100 px-6 py-5 text-sm">
                <Row label="Subtotal" value={money(subtotal, currency)} muted />
                {fees > 0.005 && <Row label="Fees & tax" value={money(fees, currency)} muted />}
                <div className="mt-2 flex items-center justify-between border-t border-dashed border-zinc-200 pt-3 text-base font-bold">
                  <span>{order.paymentStatus === "paid" ? "Total paid" : "Total due"}</span>
                  <span className="tabular-nums">{money(total, currency)}</span>
                </div>
              </div>

              {/* Email note */}
              {order.email && (
                <div className="flex items-center gap-2 border-t border-zinc-100 bg-zinc-50/60 px-6 py-4 text-xs text-zinc-500">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>
                    A receipt was sent to{" "}
                    <span className="font-medium text-zinc-700">{order.email}</span>.
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="px-6 py-8 text-center text-sm text-zinc-500">
              We couldn&apos;t load the order details here, but your order went through. Please
              check your email for the confirmation and receipt.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <Link
            href={venuePath(slug, "/menu")}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            <UtensilsCrossed className="h-4 w-4" /> Back to menu
          </Link>
          <Link
            href={venuePath(slug)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            Visit {order ? restaurantName : "restaurant"} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-zinc-400">
          Powered by{" "}
          <a
            href="https://www.dineri.app"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-zinc-500 hover:text-zinc-700"
          >
            Dineri
          </a>
        </div>
      </div>
    </main>
  );
};

const Meta = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-2.5">
    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
      <Icon className="h-4 w-4" />
    </span>
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wider text-zinc-400">{label}</div>
      <div className="truncate text-sm font-medium">{value}</div>
    </div>
  </div>
);

const Row = ({ label, value, muted }: { label: string; value: string; muted?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className={muted ? "text-zinc-500" : ""}>{label}</span>
    <span className="tabular-nums">{value}</span>
  </div>
);

export default Page;
