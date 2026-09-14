import type { ReservationSettingType } from "@/app/(dashboard)/dashboard/(with-sidebar)/reservations/types";

export function resolveDepositAmount(
    settings: Pick<ReservationSettingType, "requireDeposit" | "depositAmount" | "priorityReservationAmount">,
    isPriority: boolean,
): number {
    const deposit = settings.requireDeposit && settings.depositAmount > 0 ? settings.depositAmount : 0;
    const priorityFee = isPriority ? (settings.priorityReservationAmount ?? 0) : 0;
    return deposit + priorityFee;
}

export function requiresDeposit(
    settings: Pick<ReservationSettingType, "requireDeposit" | "depositAmount" | "priorityReservationAmount">,
    isPriority: boolean,
): boolean {
    return resolveDepositAmount(settings, isPriority) > 0;
}


export function isPriorityRequest(
    settings: Pick<ReservationSettingType, "priorityReservations">,
    requested: boolean | undefined,
): boolean {
    return !!requested && !!settings.priorityReservations;
}
