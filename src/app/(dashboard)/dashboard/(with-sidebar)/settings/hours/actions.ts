"use server";

import { db } from "@/drizzle/db";
import { restaurant } from "@/drizzle/schema";
import { logMerchantActivity } from "@/lib/activity/log";
import { ensureAuthenticatedUser } from "@/lib/auth/guards";
import { ApiResponse, RestaurantOpeningHours } from "@/lib/types";
import { eq } from "drizzle-orm";
import { RestaurantTimeZoneSchema, RestaurantTimeZoneSchemaValues } from "./schema";

type updateRestaurantOpeningHoursAction = {
  opening_hours: RestaurantOpeningHours;
  timezone: string;
};

export async function updateRestaurantOpeningHoursAction(
  input: RestaurantTimeZoneSchemaValues,
): Promise<ApiResponse<updateRestaurantOpeningHoursAction>> {
  const { session } = await ensureAuthenticatedUser();

  if (!session) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  const parsed = RestaurantTimeZoneSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input",
    };
  }

  const data = parsed.data;

  const [updatedRestaurant] = await db
    .update(restaurant)
    .set({
      timezone: data.timezone,
      opening_hours: data.opening_hours,
      updatedAt: new Date(),
    })
    .where(eq(restaurant.id, session.user.activeRestaurantId))
    .returning({
      timezone: restaurant.timezone,
      opening_hours: restaurant.opening_hours,
    });

  logMerchantActivity(session.user, {
    type: "settings.hours_updated",
    data: {},
  });

  return {
    success: true,
    data: updatedRestaurant,
  };
}
