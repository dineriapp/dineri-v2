import type { ActivitySource } from "@/drizzle/schemas/activity-schema";
import type { OrderStatus, PaymentStatus } from "@/drizzle/schemas/order-schema";
import type { ReservationStatus } from "@/drizzle/schemas/reservation-schema";
import { fmtMoney } from "@/lib/stripe/types";
import { formatOrderNumber } from "@/lib/utils";

export const ACTIVITY_KEEP_PER_RESTAURANT = 200;
export const ACTIVITY_KEEP_DAYS = 180;

export const ACTIVITY_GROUPS = [
  "order",
  "reservation",
  "menu",
  "content",
  "settings",
  "integration",
] as const;
export type ActivityGroup = (typeof ACTIVITY_GROUPS)[number];

export type ActivityText = { title: string; meta?: string };

export type ActivityDefinition<TPayload> = {
  group: ActivityGroup;
  href: string;
  coalesceMinutes?: number;
  render: (data: TPayload) => ActivityText;
};

export type AnyActivityDefinition = ActivityDefinition<never>;

type NamedPayload = { name: string };
type EmptyPayload = Record<string, never>;

function crud<TPrefix extends string>(
  prefix: TPrefix,
  group: ActivityGroup,
  href: string,
  noun: string,
): Record<
  `${TPrefix}.created` | `${TPrefix}.updated` | `${TPrefix}.deleted`,
  ActivityDefinition<NamedPayload>
> {
  const entry = (verb: string): ActivityDefinition<NamedPayload> => ({
    group,
    href,
    render: ({ name }) => ({ title: `${noun} ${verb}`, meta: name }),
  });
  return {
    [`${prefix}.created`]: entry("added"),
    [`${prefix}.updated`]: entry("updated"),
    [`${prefix}.deleted`]: entry("removed"),
  } as Record<
    `${TPrefix}.created` | `${TPrefix}.updated` | `${TPrefix}.deleted`,
    ActivityDefinition<NamedPayload>
  >;
}

function simple(
  group: ActivityGroup,
  href: string,
  title: string,
  coalesceMinutes?: number,
): ActivityDefinition<EmptyPayload> {
  return { group, href, coalesceMinutes, render: () => ({ title }) };
}

const ORDERS_HREF = "/dashboard/orders";
const RESERVATIONS_HREF = "/dashboard/reservations";

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const RESERVATION_STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  seated: "Seated",
  completed: "Completed",
  no_show: "No-show",
  cancelled: "Cancelled",
};

const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Payment pending",
  paid: "Paid",
  failed: "Payment failed",
  refunded: "Refunded",
};

/** "18:30:00" -> "18:30" */
function shortTime(time: string): string {
  return time.slice(0, 5);
}

export const ACTIVITY_DEFINITIONS = {
  // Orders
  "order.created": {
    group: "order",
    href: ORDERS_HREF,
    render: (d: {
      orderNumber: number;
      customerName: string;
      total: string;
      currency: string;
      fulfillment: string;
    }) => ({
      title: `${d.customerName} placed order ${formatOrderNumber(d.orderNumber)}`,
      meta: `${fmtMoney(Number(d.total), d.currency)} · ${d.fulfillment}`,
    }),
  },
  "order.status_changed": {
    group: "order",
    href: ORDERS_HREF,
    render: (d: { orderNumber: number; from: OrderStatus; to: OrderStatus }) => ({
      title: `Order ${formatOrderNumber(d.orderNumber)} marked ${ORDER_STATUS_LABEL[
        d.to
      ].toLowerCase()}`,
      meta: `from ${ORDER_STATUS_LABEL[d.from].toLowerCase()}`,
    }),
  },
  "order.bulk_status_changed": {
    group: "order",
    href: ORDERS_HREF,
    render: (d: { count: number; to: OrderStatus }) => ({
      title: `${d.count} orders marked ${ORDER_STATUS_LABEL[d.to].toLowerCase()}`,
    }),
  },
  "order.payment_updated": {
    group: "order",
    href: ORDERS_HREF,
    render: (d: { orderNumber: number; paymentStatus: PaymentStatus }) => ({
      title: `Order ${formatOrderNumber(d.orderNumber)} · ${PAYMENT_STATUS_LABEL[
        d.paymentStatus
      ].toLowerCase()}`,
    }),
  },

  // Reservations
  "reservation.created": {
    group: "reservation",
    href: RESERVATIONS_HREF,
    render: (d: { guestName: string; partySize: number; date: string; time: string }) => ({
      title: `${d.guestName} booked a table for ${d.partySize}`,
      meta: `${d.date} at ${shortTime(d.time)}`,
    }),
  },
  "reservation.status_changed": {
    group: "reservation",
    href: RESERVATIONS_HREF,
    render: (d: { guestName: string; from: ReservationStatus; to: ReservationStatus }) => ({
      title: `${d.guestName}'s reservation marked ${RESERVATION_STATUS_LABEL[d.to].toLowerCase()}`,
      meta: `from ${RESERVATION_STATUS_LABEL[d.from].toLowerCase()}`,
    }),
  },
  "reservation.refunded": {
    group: "reservation",
    href: RESERVATIONS_HREF,
    render: (d: {
      guestName: string;
      amount: string;
      partial: boolean;
      reason?: string | null;
    }) => ({
      title: `${d.amount} refunded to ${d.guestName}`,
      meta: [d.partial ? "Partial refund" : "Full refund", d.reason?.trim()]
        .filter(Boolean)
        .join(" · "),
    }),
  },
  "reservation.moved": {
    group: "reservation",
    href: RESERVATIONS_HREF,
    render: (d: { guestName: string; tables: string }) => ({
      title: `${d.guestName}'s reservation moved`,
      meta: d.tables,
    }),
  },
  ...crud("reservation.area", "reservation", RESERVATIONS_HREF, "Reservation area"),
  ...crud("reservation.table", "reservation", RESERVATIONS_HREF, "Reservation table"),

  // Menu
  ...crud("menu.item", "menu", "/dashboard/menu", "Menu item"),
  ...crud("menu.category", "menu", "/dashboard/menu", "Menu category"),
  "menu.publish_toggled": {
    group: "menu",
    href: "/dashboard/menu",
    render: (d: { published: boolean }) => ({
      title: `Menu ${d.published ? "published" : "unpublished"}`,
    }),
  },

  // Page content
  ...crud("link", "content", "/dashboard/links", "Link"),
  ...crud("event", "content", "/dashboard/events", "Event"),
  ...crud("faq", "content", "/dashboard/faq", "FAQ"),
  ...crud("faq.category", "content", "/dashboard/faq", "FAQ category"),
  ...crud("popup", "content", "/dashboard/popups", "Popup"),
  ...crud("story", "content", "/dashboard/success", "Success story"),
  ...crud("qr", "content", "/dashboard/qr", "QR code"),
  ...crud("gallery", "content", "/dashboard/gallery", "Gallery item"),
  "appearance.updated": simple("content", "/dashboard/appearance", "Page appearance updated", 10),

  // Settings
  "settings.business_updated": simple(
    "settings",
    "/dashboard/settings/business-information",
    "Business information updated",
    10,
  ),
  "settings.contact_updated": simple(
    "settings",
    "/dashboard/settings/contact",
    "Contact details updated",
    10,
  ),
  "settings.hours_updated": simple(
    "settings",
    "/dashboard/settings/hours",
    "Opening hours updated",
    10,
  ),
  "settings.social_updated": simple(
    "settings",
    "/dashboard/settings/social",
    "Social links updated",
    10,
  ),
  "settings.email_updated": simple(
    "settings",
    "/dashboard/settings/email",
    "Email settings updated",
    10,
  ),
  "settings.orders_updated": simple(
    "settings",
    "/dashboard/orders",
    "Ordering settings updated",
    10,
  ),
  "settings.reservations_updated": simple(
    "settings",
    RESERVATIONS_HREF,
    "Reservation settings updated",
    10,
  ),
  // Integrations
  "integration.stripe_connected": simple(
    "integration",
    "/dashboard/settings/stripe",
    "Stripe payments connected",
  ),
  "integration.stripe_disconnected": simple(
    "integration",
    "/dashboard/settings/stripe",
    "Stripe payments disconnected",
  ),
  "integration.google_connected": {
    group: "integration",
    href: "/dashboard/settings/integrations",
    render: (d: { name: string }) => ({ title: "Google Business Profile linked", meta: d.name }),
  },
  "integration.google_disconnected": simple(
    "integration",
    "/dashboard/settings/integrations",
    "Google Business Profile unlinked",
  ),
} satisfies Record<string, AnyActivityDefinition>;

export type ActivityType = keyof typeof ACTIVITY_DEFINITIONS;

export type ActivityPayload<TType extends ActivityType> = Parameters<
  (typeof ACTIVITY_DEFINITIONS)[TType]["render"]
>[0];

const ALL_ACTIVITY_TYPES = Object.keys(ACTIVITY_DEFINITIONS) as ActivityType[];

export function activityTypesInGroups(groups: readonly ActivityGroup[]): ActivityType[] {
  return ALL_ACTIVITY_TYPES.filter((type) => groups.includes(ACTIVITY_DEFINITIONS[type].group));
}

export function isActivityType(value: string): value is ActivityType {
  return value in ACTIVITY_DEFINITIONS;
}

/** A feed row, ready to render. */
export type ActivityEntry = {
  id: string;
  group: ActivityGroup;
  title: string;
  meta: string;
  href: string;
  actorName: string | null;
  source: ActivitySource;
  createdAt: string;
};

export type ActivityRow = {
  id: string;
  type: string;
  data: unknown;
  actorName: string | null;
  source: ActivitySource;
  createdAt: Date;
};

export function formatActivity(row: ActivityRow): ActivityEntry | null {
  if (!isActivityType(row.type)) return null;

  const definition: AnyActivityDefinition = ACTIVITY_DEFINITIONS[row.type];

  try {
    const { title, meta } = definition.render(row.data as never);
    // Guest names are already in the title; only staff attribution adds anything.
    const byline = row.source === "merchant" && row.actorName ? `by ${row.actorName}` : null;
    return {
      id: row.id,
      group: definition.group,
      title,
      meta: [meta, byline].filter(Boolean).join(" · "),
      href: definition.href,
      actorName: row.actorName,
      source: row.source,
      createdAt: row.createdAt.toISOString(),
    };
  } catch (error) {
    console.error(`Failed to render activity ${row.id} (${row.type}):`, error);
    return null;
  }
}
