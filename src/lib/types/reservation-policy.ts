export const RESERVATION_POLICY_IDS = [
  "cancellation-policy",
  "no-show-policy",
  "dining-policy",
] as const;

export type ReservationPolicyId = (typeof RESERVATION_POLICY_IDS)[number];

export type ReservationPolicy = {
  id: ReservationPolicyId;
  enabled: boolean;
  content: string;
};

export const RESERVATION_POLICY_TITLE: Record<ReservationPolicyId, string> = {
  "cancellation-policy": "Cancellation policy",
  "no-show-policy": "No-show policy",
  "dining-policy": "Dining policy",
};

export const RESERVATION_POLICY_HINT: Record<ReservationPolicyId, string> = {
  "cancellation-policy": "How refunds work when a guest cancels.",
  "no-show-policy": "What happens if a guest never arrives.",
  "dining-policy": "House rules for the table - dress code, time limits, large groups.",
};

const NO_SHOW_DEFAULT = `If you do not arrive within 15 minutes of your booking time and we have not heard from you, we may release your table to other guests.

Repeated no-shows may mean we ask for a deposit on future bookings.`;

const DINING_DEFAULT = `Please arrive on time so we can seat you for your full booking.

Your table is reserved for the length of your booked sitting. If you would like longer, let us know when you book and we will do our best to accommodate it.

For larger groups we may seat you across adjacent tables.`;

export function defaultCancellationContent(cancellationHours: number): string {
  const hours = Number.isFinite(cancellationHours)
    ? Math.max(0, Math.trunc(cancellationHours))
    : 24;
  const half = Math.max(1, Math.floor(hours / 2));
  const plural = (n: number) => `${n} hour${n === 1 ? "" : "s"}`;

  return `Fully refundable - free cancellation up to ${plural(hours)} before your reservation.

Partially refundable - 50% refund if cancelled at least ${plural(half)} before your reservation.

Non-refundable - no refund if cancelled less than ${plural(half)} before your reservation.`;
}

export function defaultPolicyContent(id: ReservationPolicyId, cancellationHours: number): string {
  switch (id) {
    case "cancellation-policy":
      return defaultCancellationContent(cancellationHours);
    case "no-show-policy":
      return NO_SHOW_DEFAULT;
    case "dining-policy":
      return DINING_DEFAULT;
  }
}

export function resolveReservationPolicies(
  stored: unknown,
  cancellationHours: number,
): ReservationPolicy[] {
  const saved = new Map<string, Partial<ReservationPolicy>>();
  if (Array.isArray(stored)) {
    for (const entry of stored) {
      if (
        entry &&
        typeof entry === "object" &&
        typeof (entry as ReservationPolicy).id === "string"
      ) {
        saved.set((entry as ReservationPolicy).id, entry as Partial<ReservationPolicy>);
      }
    }
  }

  return RESERVATION_POLICY_IDS.map((id) => {
    const match = saved.get(id);
    const content = typeof match?.content === "string" ? match.content : null;

    return {
      id,
      enabled: typeof match?.enabled === "boolean" ? match.enabled : true,
      content: content ?? defaultPolicyContent(id, cancellationHours),
    };
  });
}

export const visibleReservationPolicies = (policies: ReservationPolicy[]) =>
  policies.filter((p) => p.enabled && p.content.trim().length > 0);
