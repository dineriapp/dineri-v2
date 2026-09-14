"use server";

import { db } from "@/drizzle/db";
import { reservations } from "@/drizzle/schema";
import { ReservationWithArea } from "@/drizzle/types";
import { logMerchantActivity } from "@/lib/activity/log";
import { ensureAuthenticatedUserLean } from "@/lib/auth/guards";
import { validateTablePlacement } from "@/lib/services/reservation-availability";
import { ApiResponse } from "@/lib/types";
import { and, asc, eq, isNull, sql } from "drizzle-orm";

const OCCUPYING_STATUSES = new Set(["pending", "confirmed", "seated"]);

type ServiceAreaStat = {
  areaId: string | null;
  total: number;
  covers: number;
  pending: number;
  occupiedTables: number;
};

export type ServiceDayOverview = {
  covers: number;
  confirmed: number;
  pending: number;
  occupiedTables: number;
  areas: ServiceAreaStat[];
};

export async function getServiceDayOverview(
  date: string,
): Promise<ApiResponse<ServiceDayOverview>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }
    const { activeRestaurantId } = auth.session.user;

    const notCancelled = sql`${reservations.status} not in ('cancelled', 'no_show')`;

    const rows = await db
      .select({
        areaId: reservations.areaId,
        total: sql<number>`count(*)`,
        covers: sql<number>`coalesce(sum(${reservations.partySize}) filter (where ${notCancelled}), 0)`,
        confirmed: sql<number>`count(*) filter (where ${reservations.status} in ('confirmed', 'seated'))`,
        pending: sql<number>`count(*) filter (where ${reservations.status} = 'pending')`,
        occupiedTables: sql<number>`count(distinct t.value->>'id') filter (where ${notCancelled})`,
      })
      .from(reservations)

      .leftJoin(
        sql`lateral jsonb_array_elements(${reservations.assignedTables}) as t(value)`,
        sql`true`,
      )
      .where(and(eq(reservations.restaurantId, activeRestaurantId), eq(reservations.date, date)))
      .groupBy(reservations.areaId);

    const areas: ServiceAreaStat[] = rows.map((r) => ({
      areaId: r.areaId,
      total: Number(r.total),
      covers: Number(r.covers),
      pending: Number(r.pending),
      occupiedTables: Number(r.occupiedTables),
    }));

    return {
      success: true,
      data: {
        covers: rows.reduce((n, r) => n + Number(r.covers), 0),
        confirmed: rows.reduce((n, r) => n + Number(r.confirmed), 0),
        pending: rows.reduce((n, r) => n + Number(r.pending), 0),
        occupiedTables: areas.reduce((n, a) => n + a.occupiedTables, 0),
        areas,
      },
    };
  } catch (error) {
    console.error("Failed to fetch service day overview:", error);
    return { success: false, error: "Failed to fetch service overview" };
  }
}

export async function getAreaDayReservations(
  date: string,
  areaId: string,
): Promise<ApiResponse<ReservationWithArea[]>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }
    const { activeRestaurantId } = auth.session.user;

    const rows = await db.query.reservations.findMany({
      where: and(
        eq(reservations.restaurantId, activeRestaurantId),
        eq(reservations.date, date),
        eq(reservations.areaId, areaId),
      ),
      with: { area: { columns: { id: true, name: true, color: true } } },
      orderBy: [asc(reservations.time)],
    });

    return { success: true, data: rows };
  } catch (error) {
    console.error("Failed to fetch area reservations:", error);
    return { success: false, error: "Failed to fetch reservations" };
  }
}

export async function getUnseatedDayReservations(
  date: string,
): Promise<ApiResponse<ReservationWithArea[]>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }
    const { activeRestaurantId } = auth.session.user;

    const rows = await db.query.reservations.findMany({
      where: and(
        eq(reservations.restaurantId, activeRestaurantId),
        eq(reservations.date, date),
        isNull(reservations.areaId),
      ),
      orderBy: [asc(reservations.time)],
    });

    return { success: true, data: rows.map((r) => ({ ...r, area: null })) };
  } catch (error) {
    console.error("Failed to fetch unseated reservations:", error);
    return { success: false, error: "Failed to fetch reservations" };
  }
}

export type MoveReservationInput = {
  id: string;
  tableId: string;
  time: string;
};

export type MoveReservationResult = {
  id: string;
  time: string;
  areaId: string;
  assignedTables: { id: string; label: string; seats: number }[];
};

export async function moveReservationAction(
  input: MoveReservationInput,
): Promise<ApiResponse<MoveReservationResult>> {
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
        guestName: true,
      },
    });

    if (!existing) {
      return { success: false, error: "Reservation not found" };
    }

    if (!OCCUPYING_STATUSES.has(existing.status)) {
      return {
        success: false,
        error: `A ${existing.status.replace("_", "-")} reservation can't be moved. Reopen it first.`,
      };
    }

    const placement = await validateTablePlacement({
      restaurantId: activeRestaurantId,
      date: existing.date,
      time: input.time,
      partySize: existing.partySize,
      tableIds: [input.tableId],
      excludeReservationId: existing.id,
      enforceOpeningHours: true,
    });

    if (!placement.ok) {
      return { success: false, error: placement.message };
    }

    const committed = await db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext(${`reservation:${activeRestaurantId}:${existing.date}`}))`,
      );

      const confirmed = await validateTablePlacement({
        restaurantId: activeRestaurantId,
        date: existing.date,
        time: input.time,
        partySize: existing.partySize,
        tableIds: [input.tableId],
        excludeReservationId: existing.id,
        enforceOpeningHours: true,
      });

      if (!confirmed.ok) {
        return { ok: false as const, error: confirmed.message };
      }

      await tx
        .update(reservations)
        .set({
          time: input.time,
          areaId: confirmed.areaId,
          assignedTables: confirmed.tables,
          updatedAt: new Date(),
        })
        .where(
          and(eq(reservations.id, existing.id), eq(reservations.restaurantId, activeRestaurantId)),
        );

      return { ok: true as const, areaId: confirmed.areaId, tables: confirmed.tables };
    });

    if (!committed.ok) {
      return { success: false, error: committed.error };
    }

    logMerchantActivity(auth.session.user, {
      type: "reservation.moved",
      entityId: existing.id,
      data: {
        guestName: existing.guestName,
        tables: `${committed.tables.map((t) => t.label).join(", ")} at ${input.time}`,
      },
    });

    return {
      success: true,
      data: {
        id: existing.id,
        time: input.time,
        areaId: committed.areaId,
        assignedTables: committed.tables,
      },
    };
  } catch (error) {
    console.error("Failed to move reservation:", error);
    return { success: false, error: "Failed to move reservation" };
  }
}
