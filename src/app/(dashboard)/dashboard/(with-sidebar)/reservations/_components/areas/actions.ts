"use server";

import { db } from "@/drizzle/db";
import { reservationAreas } from "@/drizzle/schema";
import { ReservationAreaWithTables } from "@/drizzle/types";
import { logMerchantActivity } from "@/lib/activity/log";
import { ensureAuthenticatedUser, ensureAuthenticatedUserLean } from "@/lib/auth/guards";
import { ApiResponse } from "@/lib/types";
import {
  reservationAreaSchema,
  ReservationAreaSchemaType,
} from "@/lib/validators/zod/reservation-area.schema";
import { and, asc, eq, ne, sql } from "drizzle-orm";

const DUPLICATE_AREA_NAME_ERROR = "An area with this name already exists.";

async function nameTaken(restaurantId: string, name: string, excludeId?: string) {
  const existing = await db.query.reservationAreas.findFirst({
    where: and(
      eq(reservationAreas.restaurantId, restaurantId),
      sql`lower(${reservationAreas.name}) = lower(${name})`,
      excludeId ? ne(reservationAreas.id, excludeId) : undefined,
    ),
    columns: { id: true },
  });
  return !!existing;
}

export async function getReservationAreas(): Promise<ApiResponse<ReservationAreaWithTables[]>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }

    const { activeRestaurantId } = auth.session.user;

    const areas = await db.query.reservationAreas.findMany({
      where: eq(reservationAreas.restaurantId, activeRestaurantId),
      orderBy: [asc(reservationAreas.createdAt)],
      with: {
        tables: {
          orderBy: (t, { asc }) => [asc(t.createdAt)],
        },
      },
    });

    return { success: true, data: areas };
  } catch (error) {
    console.error("Failed to fetch reservation areas:", error);
    return { success: false, error: "Failed to fetch areas" };
  }
}

export async function createReservationArea(
  input: ReservationAreaSchemaType,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const parsed = reservationAreaSchema.safeParse(input);
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

    if (await nameTaken(activeRestaurantId, parsed.data.name)) {
      return { success: false, error: DUPLICATE_AREA_NAME_ERROR };
    }

    const [area] = await db
      .insert(reservationAreas)
      .values({
        restaurantId: activeRestaurantId,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        color: parsed.data.color,
      })
      .returning({ id: reservationAreas.id });

    logMerchantActivity(auth.session.user, {
      type: "reservation.area.created",
      entityId: area.id,
      data: { name: parsed.data.name },
    });

    return { success: true, data: { id: area.id } };
  } catch (error) {
    if ((error as { code?: string })?.code === "23505") {
      return { success: false, error: DUPLICATE_AREA_NAME_ERROR };
    }
    console.error("Failed to create reservation area:", error);
    return { success: false, error: "Failed to create area" };
  }
}

export async function updateReservationArea(
  id: string,
  input: ReservationAreaSchemaType,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const parsed = reservationAreaSchema.safeParse(input);
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

    if (await nameTaken(activeRestaurantId, parsed.data.name, id)) {
      return { success: false, error: DUPLICATE_AREA_NAME_ERROR };
    }

    await db
      .update(reservationAreas)
      .set({
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        color: parsed.data.color,
      })
      .where(
        and(eq(reservationAreas.id, id), eq(reservationAreas.restaurantId, activeRestaurantId)),
      );

    logMerchantActivity(auth.session.user, {
      type: "reservation.area.updated",
      entityId: id,
      data: { name: parsed.data.name },
    });

    return { success: true, data: { id } };
  } catch (error) {
    if ((error as { code?: string })?.code === "23505") {
      return { success: false, error: DUPLICATE_AREA_NAME_ERROR };
    }
    console.error("Failed to update reservation area:", error);
    return { success: false, error: "Failed to update area" };
  }
}

export async function deleteReservationArea(id: string): Promise<ApiResponse<{ id: string }>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }

    const { activeRestaurantId } = auth.session.user;

    const [deleted] = await db
      .delete(reservationAreas)
      .where(
        and(eq(reservationAreas.id, id), eq(reservationAreas.restaurantId, activeRestaurantId)),
      )
      .returning({ name: reservationAreas.name });

    if (deleted) {
      logMerchantActivity(auth.session.user, {
        type: "reservation.area.deleted",
        entityId: id,
        data: { name: deleted.name },
      });
    }

    return { success: true, data: { id } };
  } catch (error) {
    console.error("Failed to delete reservation area:", error);
    return { success: false, error: "Failed to delete area" };
  }
}
