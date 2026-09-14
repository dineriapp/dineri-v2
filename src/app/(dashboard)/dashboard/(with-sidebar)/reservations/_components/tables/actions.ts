"use server";

import { db } from "@/drizzle/db";
import { reservationAreas, reservationTables } from "@/drizzle/schema";
import { logMerchantActivity } from "@/lib/activity/log";
import { ensureAuthenticatedUser, ensureAuthenticatedUserLean } from "@/lib/auth/guards";
import { ApiResponse } from "@/lib/types";
import {
  reservationTableSchema,
  ReservationTableSchemaType,
} from "@/lib/validators/zod/reservation-table.schema";
import { and, eq, ne, sql } from "drizzle-orm";

const DUPLICATE_TABLE_NAME_ERROR = "A table with this name already exists in this area.";

async function assertAreaOwnership(areaId: string, activeRestaurantId: string) {
  const area = await db.query.reservationAreas.findFirst({
    where: eq(reservationAreas.id, areaId),
    columns: { restaurantId: true },
  });
  return !!area && area.restaurantId === activeRestaurantId;
}

async function labelTaken(areaId: string, label: string, excludeId?: string) {
  const existing = await db.query.reservationTables.findFirst({
    where: and(
      eq(reservationTables.areaId, areaId),
      sql`lower(${reservationTables.label}) = lower(${label})`,
      excludeId ? ne(reservationTables.id, excludeId) : undefined,
    ),
    columns: { id: true },
  });
  return !!existing;
}

export async function createReservationTable(
  input: ReservationTableSchemaType,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const parsed = reservationTableSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const auth = await ensureAuthenticatedUser();
    if (!auth.session) {
      return auth.json;
    }

    const { activeRestaurantId } = auth.session.user;

    const owned = await assertAreaOwnership(parsed.data.areaId, activeRestaurantId);
    if (!owned) {
      return { success: false, error: "Area not found or access denied" };
    }

    if (await labelTaken(parsed.data.areaId, parsed.data.label)) {
      return { success: false, error: DUPLICATE_TABLE_NAME_ERROR };
    }

    const [table] = await db
      .insert(reservationTables)
      .values({
        areaId: parsed.data.areaId,
        label: parsed.data.label,
        seats: parsed.data.seats,
        active: parsed.data.active,
      })
      .returning({ id: reservationTables.id });

    logMerchantActivity(auth.session.user, {
      type: "reservation.table.created",
      entityId: table.id,
      data: { name: parsed.data.label },
    });

    return { success: true, data: { id: table.id } };
  } catch (error) {
    if ((error as { code?: string })?.code === "23505") {
      return { success: false, error: DUPLICATE_TABLE_NAME_ERROR };
    }
    console.error("Failed to create reservation table:", error);
    return { success: false, error: "Failed to create table" };
  }
}

export async function updateReservationTable(
  id: string,
  input: ReservationTableSchemaType,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const parsed = reservationTableSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const auth = await ensureAuthenticatedUser();
    if (!auth.session) {
      return auth.json;
    }

    const { activeRestaurantId } = auth.session.user;

    const owned = await assertAreaOwnership(parsed.data.areaId, activeRestaurantId);
    if (!owned) {
      return { success: false, error: "Area not found or access denied" };
    }

    const existing = await db.query.reservationTables.findFirst({
      where: eq(reservationTables.id, id),
      with: { area: { columns: { restaurantId: true } } },
      columns: { id: true },
    });
    if (!existing || existing.area.restaurantId !== activeRestaurantId) {
      return { success: false, error: "Table not found or access denied" };
    }

    if (await labelTaken(parsed.data.areaId, parsed.data.label, id)) {
      return { success: false, error: DUPLICATE_TABLE_NAME_ERROR };
    }

    await db
      .update(reservationTables)
      .set({
        areaId: parsed.data.areaId,
        label: parsed.data.label,
        seats: parsed.data.seats,
        active: parsed.data.active,
      })
      .where(eq(reservationTables.id, id));

    logMerchantActivity(auth.session.user, {
      type: "reservation.table.updated",
      entityId: id,
      data: { name: parsed.data.label },
    });

    return { success: true, data: { id } };
  } catch (error) {
    if ((error as { code?: string })?.code === "23505") {
      return { success: false, error: DUPLICATE_TABLE_NAME_ERROR };
    }
    console.error("Failed to update reservation table:", error);
    return { success: false, error: "Failed to update table" };
  }
}

export async function toggleReservationTableActive(
  id: string,
  active: boolean,
): Promise<ApiResponse<{ id: string; active: boolean }>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }

    const { activeRestaurantId } = auth.session.user;

    const existing = await db.query.reservationTables.findFirst({
      where: eq(reservationTables.id, id),
      with: { area: { columns: { restaurantId: true } } },
      columns: { id: true, label: true },
    });
    if (!existing || existing.area.restaurantId !== activeRestaurantId) {
      return { success: false, error: "Table not found or access denied" };
    }

    await db.update(reservationTables).set({ active }).where(eq(reservationTables.id, id));

    logMerchantActivity(auth.session.user, {
      type: "reservation.table.updated",
      entityId: id,
      data: { name: `${existing.label} · ${active ? "in service" : "out of service"}` },
    });

    return { success: true, data: { id, active } };
  } catch (error) {
    console.error("Failed to update table status:", error);
    return { success: false, error: "Failed to update table status" };
  }
}

export async function deleteReservationTable(id: string): Promise<ApiResponse<{ id: string }>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }

    const { activeRestaurantId } = auth.session.user;

    const existing = await db.query.reservationTables.findFirst({
      where: eq(reservationTables.id, id),
      with: { area: { columns: { restaurantId: true } } },
      columns: { id: true },
    });
    if (!existing || existing.area.restaurantId !== activeRestaurantId) {
      return { success: false, error: "Table not found or access denied" };
    }

    const [deleted] = await db
      .delete(reservationTables)
      .where(eq(reservationTables.id, id))
      .returning({ label: reservationTables.label });

    if (deleted) {
      logMerchantActivity(auth.session.user, {
        type: "reservation.table.deleted",
        entityId: id,
        data: { name: deleted.label },
      });
    }

    return { success: true, data: { id } };
  } catch (error) {
    console.error("Failed to delete reservation table:", error);
    return { success: false, error: "Failed to delete table" };
  }
}
