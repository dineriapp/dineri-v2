"use server";

import { db } from "@/drizzle/db";
import { restaurant } from "@/drizzle/schema";
import { logMerchantActivity } from "@/lib/activity/log";
import { ensureAuthenticatedUserLean } from "@/lib/auth/guards";
import { ApiResponse } from "@/lib/types";
import { eq } from "drizzle-orm";
import {
  ReservationPoliciesSchema,
  ReservationPoliciesSchemaValues,
  ReservationSettingsSchema,
  ReservationSettingsSchemaValues,
} from "./schema";
import { ReservationPolicy } from "@/lib/types/reservation-policy";
import { ReservationSettingType } from "./types";

type UpdateReservationSettingsAction = {
  reservation_settings: ReservationSettingType;
};

export async function updateReservationSettingsAction(
  input: ReservationSettingsSchemaValues,
): Promise<ApiResponse<UpdateReservationSettingsAction>> {
  const { session } = await ensureAuthenticatedUserLean();

  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = ReservationSettingsSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const [updatedRestaurant] = await db
    .update(restaurant)
    .set({
      reservation_settings: parsed.data,
      updatedAt: new Date(),
    })
    .where(eq(restaurant.id, session.user.activeRestaurantId))
    .returning({ reservation_settings: restaurant.reservation_settings });

  logMerchantActivity(session.user, {
    type: "settings.reservations_updated",
    data: {},
  });

  return { success: true, data: updatedRestaurant };
}

type UpdateReservationPoliciesAction = {
  reservation_policies: ReservationPolicy[] | null;
};

export async function updateReservationPoliciesAction(
  input: ReservationPoliciesSchemaValues,
): Promise<ApiResponse<UpdateReservationPoliciesAction>> {
  const { session } = await ensureAuthenticatedUserLean();

  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = ReservationPoliciesSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const [updatedRestaurant] = await db
    .update(restaurant)
    .set({
      reservation_policies: parsed.data.policies,
      updatedAt: new Date(),
    })
    .where(eq(restaurant.id, session.user.activeRestaurantId))
    .returning({ reservation_policies: restaurant.reservation_policies });

  logMerchantActivity(session.user, {
    type: "settings.reservations_updated",
    data: {},
  });

  return { success: true, data: updatedRestaurant };
}
