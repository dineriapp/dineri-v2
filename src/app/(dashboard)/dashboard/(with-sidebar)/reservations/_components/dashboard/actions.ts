"use server";

import { db } from "@/drizzle/db";
import { reservations } from "@/drizzle/schema";
import { ReservationPaymentStatus, ReservationStatus } from "@/drizzle/schemas/reservation-schema";
import { ReservationWithArea } from "@/drizzle/types";
import { logMerchantActivity } from "@/lib/activity/log";
import { ensureAuthenticatedUserLean } from "@/lib/auth/guards";
import {
  scheduleReservationReminderEmail,
  sendReservationCancellationEmail,
  sendReservationConfirmationEmail,
  sendReservationReviewEmail,
} from "@/lib/email/sender-functions/send-reservation-email";
import { validateTablePlacement } from "@/lib/services/reservation-availability";
import { ApiResponse } from "@/lib/types";
import { and, asc, desc, eq, gte, lte, sql, SQL } from "drizzle-orm";
import type { ReservationGroupId } from "./groups";

const PAGE_SIZE = 25;

export type { ReservationGroupId } from "./groups";

const GROUP_PREDICATE: Record<ReservationGroupId, SQL> = {
  awaiting: sql`${reservations.status} not in ('cancelled', 'no_show', 'completed')
        and (${reservations.status} = 'pending' or ${reservations.paymentStatus} = 'pending')`,
  confirmed: sql`${reservations.status} = 'confirmed' and ${reservations.paymentStatus} <> 'pending'`,
  seated: sql`${reservations.status} = 'seated' and ${reservations.paymentStatus} <> 'pending'`,
  completed: sql`${reservations.status} = 'completed'`,
  cancelled: sql`${reservations.status} = 'cancelled'`,
  no_show: sql`${reservations.status} = 'no_show'`,
};

export type ReservationsFilters = {
  from: string | null;
  to: string | null;
  search?: string;
};

export type ReservationsListFilters = ReservationsFilters & {
  group: ReservationGroupId;
};

function buildFilterConditions(
  activeRestaurantId: string,
  filters: ReservationsFilters,
): (SQL | undefined)[] {
  const conditions: (SQL | undefined)[] = [eq(reservations.restaurantId, activeRestaurantId)];

  if (filters.from) conditions.push(gte(reservations.date, filters.from));
  if (filters.to) conditions.push(lte(reservations.date, filters.to));

  const search = filters.search?.trim();
  if (search) {
    const q = `%${search}%`;
    conditions.push(
      sql`(${reservations.guestName} ILIKE ${q}
                OR ${reservations.guestPhone} ILIKE ${q}
                OR ${reservations.guestEmail} ILIKE ${q})`,
    );
  }

  return conditions;
}

export type ReservationsSummary = {
  total: number;
  covers: number;
  groupCounts: Record<ReservationGroupId, number>;
};

export async function getReservationsSummary(
  filters: ReservationsFilters,
): Promise<ApiResponse<ReservationsSummary>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }
    const { activeRestaurantId } = auth.session.user;

    const [row] = await db
      .select({
        total: sql<number>`count(*)`,
        covers: sql<number>`coalesce(sum(${reservations.partySize}) filter (
                    where ${reservations.status} not in ('cancelled', 'no_show')
                ), 0)`,
        awaiting: sql<number>`count(*) filter (where ${GROUP_PREDICATE.awaiting})`,
        confirmed: sql<number>`count(*) filter (where ${GROUP_PREDICATE.confirmed})`,
        seated: sql<number>`count(*) filter (where ${GROUP_PREDICATE.seated})`,
        completed: sql<number>`count(*) filter (where ${GROUP_PREDICATE.completed})`,
        cancelled: sql<number>`count(*) filter (where ${GROUP_PREDICATE.cancelled})`,
        noShow: sql<number>`count(*) filter (where ${GROUP_PREDICATE.no_show})`,
      })
      .from(reservations)
      .where(and(...buildFilterConditions(activeRestaurantId, filters)));

    return {
      success: true,
      data: {
        total: Number(row?.total ?? 0),
        covers: Number(row?.covers ?? 0),
        groupCounts: {
          awaiting: Number(row?.awaiting ?? 0),
          confirmed: Number(row?.confirmed ?? 0),
          seated: Number(row?.seated ?? 0),
          completed: Number(row?.completed ?? 0),
          cancelled: Number(row?.cancelled ?? 0),
          no_show: Number(row?.noShow ?? 0),
        },
      },
    };
  } catch (error) {
    console.error("Failed to fetch reservations summary:", error);
    return { success: false, error: "Failed to fetch reservations summary" };
  }
}

export type ReservationsPage = {
  reservations: ReservationWithArea[];
  nextCursor: string | null;
};

const encodeCursor = (r: ReservationWithArea) => `${r.date}|${r.time}|${r.id}`;

export async function getReservationsPage(
  filters: ReservationsListFilters,
  cursor: string | null = null,
): Promise<ApiResponse<ReservationsPage>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }
    const { activeRestaurantId } = auth.session.user;

    const conditions = buildFilterConditions(activeRestaurantId, filters);
    conditions.push(GROUP_PREDICATE[filters.group]);

    const newestFirst = filters.from === null && filters.to === null;

    if (cursor) {
      const [date, time, id] = cursor.split("|");
      const tuple = sql`(${reservations.date}, ${reservations.time}, ${reservations.id})`;
      const cursorTuple = sql`(${date}::date, ${time}::time, ${id}::uuid)`;
      conditions.push(
        newestFirst ? sql`${tuple} < ${cursorTuple}` : sql`${tuple} > ${cursorTuple}`,
      );
    }

    const rows = await db.query.reservations.findMany({
      where: and(...conditions),
      orderBy: newestFirst
        ? [desc(reservations.date), desc(reservations.time), desc(reservations.id)]
        : [asc(reservations.date), asc(reservations.time), asc(reservations.id)],
      limit: PAGE_SIZE + 1,
      with: {
        area: { columns: { id: true, name: true, color: true } },
      },
    });

    const hasMore = rows.length > PAGE_SIZE;
    const pageRows = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

    return {
      success: true,
      data: {
        reservations: pageRows,
        nextCursor: hasMore ? encodeCursor(pageRows[pageRows.length - 1]) : null,
      },
    };
  } catch (error) {
    console.error("Failed to fetch reservations:", error);
    return { success: false, error: "Failed to fetch reservations" };
  }
}

type UpdateReservationStatusInput = {
  id: string;
  status: ReservationStatus;
  paymentStatus: ReservationPaymentStatus;
};

const OCCUPYING_STATUSES = new Set<ReservationStatus>(["pending", "confirmed", "seated"]);

const TERMINAL_STATUSES = new Set<ReservationStatus>(["completed", "cancelled", "no_show"]);

const TERMINAL_STATUS_ERROR: Record<string, string> = {
  completed: "Completed reservations can't have their status changed.",
  cancelled: "Cancelled reservations can't have their status changed.",
  no_show: "No-show reservations can't have their status changed.",
};

export async function updateReservationStatusAction(
  input: UpdateReservationStatusInput,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }

    const { activeRestaurantId } = auth.session.user;

    const existing = await db.query.reservations.findFirst({
      where: and(eq(reservations.id, input.id), eq(reservations.restaurantId, activeRestaurantId)),
      columns: {
        id: true,
        date: true,
        time: true,
        partySize: true,
        status: true,
        paymentStatus: true,
        assignedTables: true,
        guestName: true,
        guestEmail: true,
      },
    });

    if (!existing) {
      return { success: false, error: "Reservation not found" };
    }

    if (TERMINAL_STATUSES.has(existing.status) && input.status !== existing.status) {
      return { success: false, error: TERMINAL_STATUS_ERROR[existing.status] };
    }

    if (input.paymentStatus !== existing.paymentStatus) {
      return {
        success: false,
        error: "Payment status is set by Stripe and can't be changed by hand.",
      };
    }

    const announceStatusChange = () => {
      if (input.status === existing.status) return;

      logMerchantActivity(auth.session.user, {
        type: "reservation.status_changed",
        entityId: existing.id,
        data: {
          guestName: existing.guestName,
          from: existing.status,
          to: input.status,
        },
      });

      const emailInput = {
        restaurantId: activeRestaurantId,
        guestName: existing.guestName,
        guestEmail: existing.guestEmail,
        partySize: existing.partySize,
        date: existing.date,
        time: existing.time,
      };

      if (input.status === "confirmed") {
        sendReservationConfirmationEmail(emailInput);
        scheduleReservationReminderEmail(emailInput);
      } else if (input.status === "cancelled") {
        sendReservationCancellationEmail(emailInput);
      } else if (input.status === "completed") {
        sendReservationReviewEmail(emailInput);
      }
    };

    const reclaimsTable =
      !OCCUPYING_STATUSES.has(existing.status) && OCCUPYING_STATUSES.has(input.status);

    if (!reclaimsTable) {
      await db
        .update(reservations)
        .set({ status: input.status, updatedAt: new Date() })
        .where(
          and(eq(reservations.id, existing.id), eq(reservations.restaurantId, activeRestaurantId)),
        );

      announceStatusChange();
      return { success: true, data: { id: input.id } };
    }

    const tableIds = existing.assignedTables.map((t) => t.id);
    if (tableIds.length === 0) {
      return {
        success: false,
        error: "This reservation has no table assigned, so it can't be reopened from here.",
      };
    }

    const committed = await db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext(${`reservation:${activeRestaurantId}:${existing.date}`}))`,
      );

      const placement = await validateTablePlacement({
        restaurantId: activeRestaurantId,
        date: existing.date,
        time: existing.time.slice(0, 5),
        partySize: existing.partySize,
        tableIds,
        excludeReservationId: existing.id,
        enforceOpeningHours: false,
      });

      if (!placement.ok) {
        return { ok: false as const, error: placement.message };
      }

      await tx
        .update(reservations)
        .set({ status: input.status, updatedAt: new Date() })
        .where(
          and(eq(reservations.id, existing.id), eq(reservations.restaurantId, activeRestaurantId)),
        );

      return { ok: true as const };
    });

    if (!committed.ok) {
      return { success: false, error: committed.error };
    }

    announceStatusChange();
    return { success: true, data: { id: input.id } };
  } catch (error) {
    console.error("Failed to update reservation:", error);
    return { success: false, error: "Failed to update reservation" };
  }
}
