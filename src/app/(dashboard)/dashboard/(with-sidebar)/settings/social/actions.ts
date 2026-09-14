"use server";

import { db } from "@/drizzle/db";
import { restaurant } from "@/drizzle/schema";
import { logMerchantActivity } from "@/lib/activity/log";
import { ensureAuthenticatedUser } from "@/lib/auth/guards";
import { ApiResponse } from "@/lib/types";
import { eq } from "drizzle-orm";
import { SocialLinksSchema, SocialLinksSchemaValues } from "./schema";

type updateRestaurantSocialLinksAction = {
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  x_twitter: string | null;
  youtube?: string | null;
  linkedin?: string | null;
  whatsapp?: string | null;
};

export async function updateRestaurantSocialLinksAction(
  input: SocialLinksSchemaValues,
): Promise<ApiResponse<updateRestaurantSocialLinksAction>> {
  const { session } = await ensureAuthenticatedUser();

  if (!session) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  const parsed = SocialLinksSchema.safeParse(input);

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
      instagram: data.instagram,
      facebook: data.facebook,
      tiktok: data.tiktok,
      x_twitter: data.x_twitter,
      youtube: data.youtube,
      linkedin: data.linkedin,
      whatsapp: data.whatsapp,
      updatedAt: new Date(),
    })
    .where(eq(restaurant.id, session.user.activeRestaurantId))
    .returning({
      instagram: restaurant.instagram,
      facebook: restaurant.facebook,
      tiktok: restaurant.tiktok,
      x_twitter: restaurant.x_twitter,
      youtube: restaurant.youtube,
      linkedin: restaurant.linkedin,
      whatsapp: restaurant.whatsapp,
    });

  logMerchantActivity(session.user, {
    type: "settings.social_updated",
    data: {},
  });

  return {
    success: true,
    data: updatedRestaurant,
  };
}
