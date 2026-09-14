"use server";

import { db } from "@/drizzle/db";
import { restaurant } from "@/drizzle/schema";
import { logMerchantActivity } from "@/lib/activity/log";
import { ensureAuthenticatedUser } from "@/lib/auth/guards";
import { ApiResponse } from "@/lib/types";
import { eq } from "drizzle-orm";
import { BrandingData } from "./_components/sections/branding";
import { AppearanceSettings } from "@/lib/types/appearnace";

type UpdateRestaurantBusinessInfoData = {
  branding: BrandingData;
  appearance_settings: AppearanceSettings;
};

export async function updateRestaurantAppearance(
  branding: BrandingData,
  appearance_settings: AppearanceSettings,
): Promise<ApiResponse<UpdateRestaurantBusinessInfoData>> {
  const { session } = await ensureAuthenticatedUser();

  if (!session) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  const [updatedRestaurant] = await db
    .update(restaurant)
    .set({
      name: branding.name,
      bio: branding.bio,
      tagline: branding.tagline,
      appearance_settings: appearance_settings,
      updatedAt: new Date(),
    })
    .where(eq(restaurant.id, session.user.activeRestaurantId))
    .returning({
      name: restaurant.name,
      bio: restaurant.bio,
      tagline: restaurant.tagline,
      appearance_settings: restaurant.appearance_settings,
    });

  logMerchantActivity(session.user, {
    type: "appearance.updated",
    data: {},
  });

  return {
    success: true,
    data: {
      branding: {
        bio: updatedRestaurant.bio ?? "",
        name: updatedRestaurant.name ?? "",
        tagline: updatedRestaurant.tagline ?? "",
      },
      appearance_settings: updatedRestaurant.appearance_settings,
    },
  };
}
