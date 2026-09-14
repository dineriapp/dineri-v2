import "server-only";

import { db } from "@/drizzle/db";
import { reservationAreas, reservations, reservationTables, restaurant } from "@/drizzle/schema";
import { RestaurantOpeningHours } from "../types";
import { and, eq, inArray } from "drizzle-orm";
import { DateTime } from "luxon";

export type ReservationAvailabilityReason =
    | "RESTAURANT_NOT_FOUND"
    | "INVALID_INPUT"
    | "TABLE_NOT_FOUND"
    | "TABLE_TOO_SMALL"
    | "TABLES_SPAN_AREAS"
    | "EMERGENCY_STOP"
    | "NOT_ACCEPTING_RESERVATIONS"
    | "RESTAURANT_CLOSED_DAY"
    | "RESTAURANT_CLOSED_TIME"
    | "MIN_PARTY_SIZE"
    | "MAX_PARTY_SIZE"
    | "LEAD_TIME"
    | "MAX_ADVANCE_DAYS"
    | "NOT_ENOUGH_TIME_BEFORE_CLOSE"
    | "NO_TABLE_CAPACITY"
    | "TABLE_CONFLICT"
    | "NO_TABLE_COMBINATION";

export type ReservationAvailabilityInput = {
    restaurantId: string;
    date: string;
    time: string;
    partySize: number;
    areaId?: string | null;
    excludeReservationId?: string | null;
    isPriority?: boolean;
};

type ReservationAvailabilityDetails = {
    date: string;
    time: string;
    endTime: string;
    partySize: number;
    slotDurationMinutes: number;
};

export type AssignedTable = { id: string; label: string; seats: number };

export type ReservationAvailabilityResult =
    | {
        available: true;
        reason: null;
        message: string;
        area: { id: string; name: string; color: string } | null;
        assignedTables: AssignedTable[];
        requiresManualSeating: boolean;
        details: ReservationAvailabilityDetails;
    }
    | {
        available: false;
        reason: ReservationAvailabilityReason;
        message: string;
        area: null;
        assignedTables: [];
        requiresManualSeating: false;
        details: ReservationAvailabilityDetails | null;
    };


const CAPACITY_REASONS: ReservationAvailabilityReason[] = [
    "NO_TABLE_CAPACITY",
    "TABLE_CONFLICT",
    "NO_TABLE_COMBINATION",
];


const OCCUPYING_STATUSES = ["pending", "confirmed", "seated"] as const;

function fail(
    reason: ReservationAvailabilityReason,
    message: string,
    details: ReservationAvailabilityDetails | null = null,
): ReservationAvailabilityResult {
    return {
        available: false, reason, message,
        area: null, assignedTables: [], requiresManualSeating: false, details,
    };
}

function isValidDateString(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && DateTime.fromISO(value).isValid;
}

function isValidTimeString(value: string): boolean {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function toHHmm(time: string): string {
    return time.slice(0, 5);
}

function formatMinutesAsDuration(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours} hour${hours === 1 ? "" : "s"}`;
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

function getOpeningWindowForDate(
    openingHours: RestaurantOpeningHours,
    timezone: string,
    dateInZone: DateTime,
): { open: DateTime; close: DateTime } | null {
    const dayIdx = dateInZone.weekday % 7;
    const schedule = openingHours[dayIdx];
    if (!schedule?.isOpen || !schedule.openTime || !schedule.closeTime) return null;

    const [openH, openM] = schedule.openTime.split(":").map(Number);
    const [closeH, closeM] = schedule.closeTime.split(":").map(Number);

    const open = dateInZone.set({ hour: openH, minute: openM, second: 0, millisecond: 0 });
    let close = dateInZone.set({ hour: closeH, minute: closeM, second: 0, millisecond: 0 });
    if (close <= open) close = close.plus({ days: 1 });

    return { open, close };
}

type TableRow = { id: string; label: string; seats: number };
type AreaWithTables = { id: string; name: string; color: string; tables: TableRow[] };

function* combinationsOf<T>(items: T[], size: number): Generator<T[]> {
    if (size === 0) {
        yield [];
        return;
    }
    for (let i = 0; i <= items.length - size; i++) {
        for (const rest of combinationsOf(items.slice(i + 1), size - 1)) {
            yield [items[i], ...rest];
        }
    }
}


const MAX_COMBINED_TABLES = 4;

function findBestCombination(
    tables: TableRow[],
    partySize: number,
    maxTables: number,
): TableRow[] | null {
    const cap = Math.min(maxTables, MAX_COMBINED_TABLES, tables.length);
    for (let size = 1; size <= cap; size++) {
        let best: TableRow[] | null = null;
        let bestExcess = Infinity;
        for (const combo of combinationsOf(tables, size)) {
            const total = combo.reduce((sum, t) => sum + t.seats, 0);
            if (total < partySize) continue;
            const excess = total - partySize;
            if (excess < bestExcess) {
                bestExcess = excess;
                best = combo;
            }
        }
        if (best) return best;
    }
    return null;
}

async function getOccupiedTableIds(params: {
    restaurantId: string;
    date: string;
    timezone: string;
    slotDurationMinutes: number;
    windowStart: DateTime;
    windowEnd: DateTime;
    excludeReservationId?: string | null;
}): Promise<Set<string>> {
    const { restaurantId, date, timezone, slotDurationMinutes, windowStart, windowEnd } = params;

    const rows = await db.query.reservations.findMany({
        where: and(
            eq(reservations.restaurantId, restaurantId),
            eq(reservations.date, date),
            inArray(reservations.status, [...OCCUPYING_STATUSES]),
        ),
        columns: { id: true, time: true, assignedTables: true },
    });

    const occupied = new Set<string>();
    for (const row of rows) {
        if (params.excludeReservationId && row.id === params.excludeReservationId) continue;

        const start = DateTime.fromISO(`${date}T${toHHmm(row.time)}`, { zone: timezone });
        const end = start.plus({ minutes: slotDurationMinutes });
        if (start >= windowEnd || end <= windowStart) continue;

        for (const table of row.assignedTables) occupied.add(table.id);
    }

    return occupied;
}

function totalSeats(tables: TableRow[]): number {
    return tables.reduce((sum, t) => sum + t.seats, 0);
}

function isBetterAssignment(
    candidate: TableRow[],
    current: TableRow[] | null,
    partySize: number,
): boolean {
    if (!current) return true;
    if (candidate.length !== current.length) return candidate.length < current.length;
    return totalSeats(candidate) - partySize < totalSeats(current) - partySize;
}


export type TablePlacementInput = {
    restaurantId: string;
    date: string;
    time: string;
    partySize: number;
    tableIds: string[];
    excludeReservationId?: string | null;
    enforceOpeningHours: boolean;
};

export type TablePlacementResult =
    | { ok: true; areaId: string; tables: AssignedTable[] }
    | { ok: false; reason: ReservationAvailabilityReason; message: string };


export async function validateTablePlacement(
    input: TablePlacementInput,
): Promise<TablePlacementResult> {
    const { restaurantId, date, time, partySize, tableIds } = input;

    if (
        !restaurantId ||
        !isValidDateString(date) ||
        !isValidTimeString(time) ||
        !Number.isInteger(partySize) ||
        partySize < 1 ||
        tableIds.length === 0
    ) {
        return { ok: false, reason: "INVALID_INPUT", message: "Invalid move request." };
    }

    const restaurantRecord = await db.query.restaurant.findFirst({
        where: eq(restaurant.id, restaurantId),
        columns: { id: true, timezone: true, opening_hours: true, reservation_settings: true },
    });
    if (!restaurantRecord) {
        return { ok: false, reason: "RESTAURANT_NOT_FOUND", message: "Restaurant not found." };
    }

    const timezone = restaurantRecord.timezone;
    const slotDurationMinutes = restaurantRecord.reservation_settings.slotDurationMinutes;

    const start = DateTime.fromISO(`${date}T${time}`, { zone: timezone });
    if (!start.isValid) {
        return { ok: false, reason: "INVALID_INPUT", message: "Invalid date or time." };
    }
    const end = start.plus({ minutes: slotDurationMinutes });

    if (input.enforceOpeningHours) {
        const window = getOpeningWindowForDate(restaurantRecord.opening_hours, timezone, start);
        if (!window) {
            return {
                ok: false,
                reason: "RESTAURANT_CLOSED_DAY",
                message: "The restaurant is closed on that day.",
            };
        }
        if (start < window.open || start >= window.close) {
            return {
                ok: false,
                reason: "RESTAURANT_CLOSED_TIME",
                message: `That time is outside opening hours (${window.open.toFormat("HH:mm")}-${window.close.toFormat("HH:mm")}).`,
            };
        }
        if (end > window.close) {
            return {
                ok: false,
                reason: "NOT_ENOUGH_TIME_BEFORE_CLOSE",
                message: `A ${formatMinutesAsDuration(slotDurationMinutes)} booking starting then would run past closing.`,
            };
        }
    }

    const tableRows = await db
        .select({
            id: reservationTables.id,
            label: reservationTables.label,
            seats: reservationTables.seats,
            active: reservationTables.active,
            areaId: reservationTables.areaId,
        })
        .from(reservationTables)
        .innerJoin(reservationAreas, eq(reservationTables.areaId, reservationAreas.id))
        .where(and(
            inArray(reservationTables.id, tableIds),
            eq(reservationAreas.restaurantId, restaurantId),
        ));

    if (tableRows.length !== tableIds.length) {
        return {
            ok: false,
            reason: "TABLE_NOT_FOUND",
            message: "That table no longer exists.",
        };
    }
    const inactive = tableRows.find((t) => !t.active);
    if (inactive) {
        return {
            ok: false,
            reason: "TABLE_NOT_FOUND",
            message: `Table ${inactive.label} is currently out of service.`,
        };
    }

    // Combined tables have to sit in one room to actually be pushed together.
    const areaId = tableRows[0].areaId;
    if (tableRows.some((t) => t.areaId !== areaId)) {
        return {
            ok: false,
            reason: "TABLES_SPAN_AREAS",
            message: "Combined tables must all be in the same area.",
        };
    }

    const seats = tableRows.reduce((sum, t) => sum + t.seats, 0);
    if (seats < partySize) {
        const label = tableRows.map((t) => t.label).join(" + ");
        return {
            ok: false,
            reason: "TABLE_TOO_SMALL",
            message: `${label} seats ${seats}, but this booking is for ${partySize} guest${partySize === 1 ? "" : "s"}.`,
        };
    }

    const occupied = await getOccupiedTableIds({
        restaurantId,
        date,
        timezone,
        slotDurationMinutes,
        windowStart: start,
        windowEnd: end,
        excludeReservationId: input.excludeReservationId,
    });

    const clashing = tableRows.filter((t) => occupied.has(t.id));
    if (clashing.length > 0) {
        const label = clashing.map((t) => t.label).join(", ");
        return {
            ok: false,
            reason: "TABLE_CONFLICT",
            message: `${label} ${clashing.length === 1 ? "is" : "are"} already booked at ${time}.`,
        };
    }

    return {
        ok: true,
        areaId,
        tables: tableRows.map((t) => ({ id: t.id, label: t.label, seats: t.seats })),
    };
}

export async function checkReservationAvailability(
    input: ReservationAvailabilityInput,
): Promise<ReservationAvailabilityResult> {
    const { restaurantId, date, time, partySize, areaId } = input;

    if (
        !restaurantId ||
        !isValidDateString(date) ||
        !isValidTimeString(time) ||
        !Number.isInteger(partySize) ||
        partySize < 1
    ) {
        return fail("INVALID_INPUT", "Please provide a valid date, time, and party size.");
    }

    const restaurantRecord = await db.query.restaurant.findFirst({
        where: eq(restaurant.id, restaurantId),
        columns: {
            id: true,
            timezone: true,
            opening_hours: true,
            reservation_settings: true,
        },
    });

    if (!restaurantRecord) {
        return fail("RESTAURANT_NOT_FOUND", "Restaurant not found.");
    }

    const settings = restaurantRecord.reservation_settings;
    const timezone = restaurantRecord.timezone;

    const requested = DateTime.fromISO(`${date}T${time}`, { zone: timezone });
    if (!requested.isValid) {
        return fail("INVALID_INPUT", "Please provide a valid date, time, and party size.");
    }

    const slotDurationMinutes = settings.slotDurationMinutes;
    const details: ReservationAvailabilityDetails = {
        date,
        time,
        endTime: requested.plus({ minutes: slotDurationMinutes }).toFormat("HH:mm"),
        partySize,
        slotDurationMinutes,
    };


    if (settings.emergencyStop) {
        return fail(
            "EMERGENCY_STOP",
            "Online reservations are temporarily paused. Please call the restaurant directly.",
            details,
        );
    }
    if (!settings.acceptingReservations) {
        return fail(
            "NOT_ACCEPTING_RESERVATIONS",
            "This restaurant isn't accepting online reservations right now.",
            details,
        );
    }


    const window = getOpeningWindowForDate(restaurantRecord.opening_hours, timezone, requested);
    if (!window) {
        return fail(
            "RESTAURANT_CLOSED_DAY",
            "Restaurant is closed on the selected day.",
            details,
        );
    }
    if (requested < window.open || requested >= window.close) {
        return fail(
            "RESTAURANT_CLOSED_TIME",
            "Restaurant is closed at the selected time.",
            details,
        );
    }


    if (partySize < settings.minPartySize) {
        return fail(
            "MIN_PARTY_SIZE",
            `Party size is below the minimum allowed. Minimum is ${settings.minPartySize} guest${settings.minPartySize === 1 ? "" : "s"}.`,
            details,
        );
    }
    if (partySize > settings.maxPartySize) {
        return fail(
            "MAX_PARTY_SIZE",
            `Party size exceeds the maximum allowed. Maximum is ${settings.maxPartySize} guests.`,
            details,
        );
    }

    const now = DateTime.now().setZone(timezone);
    const earliestBookable = now.plus({ minutes: settings.leadTimeMinutes });
    if (requested < earliestBookable) {
        return fail(
            "LEAD_TIME",
            `Reservations must be made at least ${formatMinutesAsDuration(settings.leadTimeMinutes)} in advance.`,
            details,
        );
    }

    const advanceDays = requested.startOf("day").diff(now.startOf("day"), "days").days;
    if (advanceDays > settings.maxAdvanceDays) {
        return fail(
            "MAX_ADVANCE_DAYS",
            `Maximum advance booking period exceeded. You can book up to ${settings.maxAdvanceDays} day${settings.maxAdvanceDays === 1 ? "" : "s"} ahead.`,
            details,
        );
    }


    const requestedEnd = requested.plus({ minutes: slotDurationMinutes });
    if (requestedEnd > window.close) {
        return fail(
            "NOT_ENOUGH_TIME_BEFORE_CLOSE",
            "There isn't enough time before the restaurant closes.",
            details,
        );
    }


    const areaRows = await db.query.reservationAreas.findMany({
        where: areaId
            ? and(eq(reservationAreas.restaurantId, restaurantId), eq(reservationAreas.id, areaId))
            : eq(reservationAreas.restaurantId, restaurantId),
        columns: { id: true, name: true, color: true },
        with: {
            tables: {
                where: (t, { eq }) => eq(t.active, true),
                columns: { id: true, label: true, seats: true },
            },
        },
    });

    if (areaId && areaRows.length === 0) {
        return fail("INVALID_INPUT", "Selected dining area could not be found.", details);
    }

    const requestedAreaName = areaId ? (areaRows[0]?.name ?? null) : null;

    const allowCombination = settings.allowTableCombination;

    const candidateAreas: AreaWithTables[] = allowCombination
        ? areaRows.filter((a) => totalSeats(a.tables) >= partySize)
        : areaRows
            .map((a) => ({ ...a, tables: a.tables.filter((t) => t.seats >= partySize) }))
            .filter((a) => a.tables.length > 0);

    const capacityFail = (
        reason: ReservationAvailabilityReason,
        message: string,
    ): ReservationAvailabilityResult => {
        if (input.isPriority && CAPACITY_REASONS.includes(reason)) {
            return {
                available: true,
                reason: null,
                message:
                    "We're fully booked at this time, but your priority reservation will be accepted and the restaurant will make room for you.",
                area: null,
                assignedTables: [],
                requiresManualSeating: true,
                details,
            };
        }
        return fail(reason, message, details);
    };

    if (candidateAreas.length === 0) {
        return allowCombination
            ? capacityFail(
                "NO_TABLE_COMBINATION",
                requestedAreaName
                    ? `No suitable combination of available tables exists in ${requestedAreaName} for a party of ${partySize}.`
                    : "No suitable combination of available tables exists within the same dining area.",
            )
            : capacityFail(
                "NO_TABLE_CAPACITY",
                requestedAreaName
                    ? `${requestedAreaName} doesn't have a table big enough for a party of ${partySize}. Try a smaller party size or a different area.`
                    : `We don't have a table big enough for a party of ${partySize}. Please try a smaller party size or contact the restaurant directly.`,
            );
    }

    const occupiedTableIds = await getOccupiedTableIds({
        restaurantId,
        date,
        timezone,
        slotDurationMinutes,
        windowStart: requested,
        windowEnd: requestedEnd,
        excludeReservationId: input.excludeReservationId,
    });

    const maxTables = allowCombination ? Number.MAX_SAFE_INTEGER : 1;

    let bestArea: AreaWithTables | null = null;
    let bestAssignment: TableRow[] | null = null;

    for (const area of candidateAreas) {
        const freeTables = area.tables
            .filter((t) => !occupiedTableIds.has(t.id))
            .sort((a, b) => a.seats - b.seats || a.id.localeCompare(b.id));

        const assignment = findBestCombination(freeTables, partySize, maxTables);
        if (assignment && isBetterAssignment(assignment, bestAssignment, partySize)) {
            bestArea = area;
            bestAssignment = assignment;
        }
    }

    if (!bestArea || !bestAssignment) {
        return allowCombination
            ? capacityFail(
                "NO_TABLE_COMBINATION",
                requestedAreaName
                    ? `No suitable combination of available tables exists in ${requestedAreaName} at this time.`
                    : "No suitable combination of available tables exists within the same dining area.",
            )
            : capacityFail(
                "TABLE_CONFLICT",
                requestedAreaName
                    ? `All tables in ${requestedAreaName} are already booked at this time. Please try a different time or choose another area.`
                    : "All tables suitable for your party size are already booked at this time. Please try a different time.",
            );
    }

    return {
        available: true,
        reason: null,
        message: "Great! A table is currently available for your selected date, time, and party size.",
        area: { id: bestArea.id, name: bestArea.name, color: bestArea.color },
        assignedTables: bestAssignment.map((t) => ({ id: t.id, label: t.label, seats: t.seats })),
        requiresManualSeating: false,
        details,
    };
}
