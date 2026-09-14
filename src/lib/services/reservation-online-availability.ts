import type { ReservationSettingType } from "@/app/(dashboard)/dashboard/(with-sidebar)/reservations/types";

export type OnlineReservationsBlockedReason =
    | "EMERGENCY_STOP"
    | "NOT_ACCEPTING_RESERVATIONS"
    | "WIDGET_DISABLED"
    // The venue's plan doesn't include reservations at all. Guests never see
    // the plan itself - only that the venue isn't taking bookings here.
    | "NOT_ON_PLAN";

export type OnlineReservationsStatus =
    | { available: true; reason: null; message: null }
    | { available: false; reason: OnlineReservationsBlockedReason; message: string };

export type OnlineReservationSettings = Pick<
    ReservationSettingType,
    "emergencyStop" | "acceptingReservations" | "showOnlineWidget"
>;

export const ONLINE_RESERVATIONS_BLOCKED_MESSAGES: Record<
    OnlineReservationsBlockedReason,
    string
> = {
    EMERGENCY_STOP:
        "Online reservations are temporarily paused. Please call the restaurant directly.",
    NOT_ACCEPTING_RESERVATIONS: "This restaurant isn't accepting online reservations right now.",
    WIDGET_DISABLED: "Online booking isn't available for this restaurant right now.",
    NOT_ON_PLAN: "Online booking isn't available for this restaurant.",
};

const AVAILABLE: OnlineReservationsStatus = { available: true, reason: null, message: null };

function blocked(reason: OnlineReservationsBlockedReason): OnlineReservationsStatus {
    return { available: false, reason, message: ONLINE_RESERVATIONS_BLOCKED_MESSAGES[reason] };
}

export function getOnlineReservationsStatus(
    settings: OnlineReservationSettings | null | undefined,
): OnlineReservationsStatus {
    if (!settings) return blocked("NOT_ACCEPTING_RESERVATIONS");
    if (settings.emergencyStop) return blocked("EMERGENCY_STOP");
    if (!settings.acceptingReservations) return blocked("NOT_ACCEPTING_RESERVATIONS");
    if (!settings.showOnlineWidget) return blocked("WIDGET_DISABLED");
    return AVAILABLE;
}

export function areOnlineReservationsAvailable(
    settings: OnlineReservationSettings | null | undefined,
): boolean {
    return getOnlineReservationsStatus(settings).available;
}
