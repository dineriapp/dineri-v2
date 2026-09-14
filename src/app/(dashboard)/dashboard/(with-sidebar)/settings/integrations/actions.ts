"use server";

import { db } from "@/drizzle/db";
import { restaurant } from "@/drizzle/schema";
import { logMerchantActivity } from "@/lib/activity/log";
import { ensureAuthenticatedUserLean } from "@/lib/auth/guards";
import { fetchGooglePlaceRating, GooglePlaceRating } from "@/lib/google/places";
import { ApiResponse } from "@/lib/types";
import { eq } from "drizzle-orm";

export async function connectGooglePlaceId(
  placeId: string,
): Promise<ApiResponse<{ placeId: string } & GooglePlaceRating>> {
  const auth = await ensureAuthenticatedUserLean();
  if (!auth.session) {
    return auth.json;
  }

  const trimmed = placeId.trim();
  if (!trimmed) {
    return { success: false, error: "Enter a Google Place ID" };
  }

  const place = await fetchGooglePlaceRating(trimmed);
  if (!place) {
    return {
      success: false,
      error:
        "Couldn't find a Google Business Profile with that Place ID. Double check it and try again.",
    };
  }

  await db
    .update(restaurant)
    .set({ googlePlaceId: trimmed, updatedAt: new Date() })
    .where(eq(restaurant.id, auth.session.user.activeRestaurantId));

  logMerchantActivity(auth.session.user, {
    type: "integration.google_connected",
    entityId: trimmed,
    data: { name: place.name },
  });

  return { success: true, data: { placeId: trimmed, ...place } };
}

export async function disconnectGooglePlaceId(): Promise<ApiResponse<null>> {
  const auth = await ensureAuthenticatedUserLean();
  if (!auth.session) {
    return auth.json;
  }

  await db
    .update(restaurant)
    .set({ googlePlaceId: null, updatedAt: new Date() })
    .where(eq(restaurant.id, auth.session.user.activeRestaurantId));

  logMerchantActivity(auth.session.user, {
    type: "integration.google_disconnected",
    data: {},
  });

  return { success: true, data: null };
}

export async function getActiveRestaurantGoogleRating(): Promise<
  ApiResponse<GooglePlaceRating | null>
> {
  const auth = await ensureAuthenticatedUserLean();
  if (!auth.session) {
    return auth.json;
  }

  const record = await db.query.restaurant.findFirst({
    where: eq(restaurant.id, auth.session.user.activeRestaurantId),
    columns: { googlePlaceId: true },
  });

  if (!record?.googlePlaceId) {
    return { success: true, data: null };
  }

  const place = await fetchGooglePlaceRating(record.googlePlaceId);
  return { success: true, data: place };
}
