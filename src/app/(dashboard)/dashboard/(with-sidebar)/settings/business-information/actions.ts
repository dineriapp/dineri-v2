"use server";

import { db } from "@/drizzle/db";
import { restaurant } from "@/drizzle/schema";
import { logMerchantActivity } from "@/lib/activity/log";
import { ensureAuthenticatedUser } from "@/lib/auth/guards";
import { ApiResponse } from "@/lib/types";
import { and, eq } from "drizzle-orm";
import { BusinessInformationSchema, BusinessInformationSchemaValues } from "./schema";

type UpdateRestaurantBusinessInfoData = {
  name: string;
  slug: string;
  bio: string | null;
  tagline: string | null;
  logo: typeof restaurant.$inferSelect.logo;
};

export async function updateRestaurantBusinessInfoAction(
  input: BusinessInformationSchemaValues,
): Promise<ApiResponse<UpdateRestaurantBusinessInfoData>> {
  const { session } = await ensureAuthenticatedUser();

  if (!session) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  const parsed = BusinessInformationSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input",
    };
  }

  const data = parsed.data;

  const existingRestaurant = await db.query.restaurant.findFirst({
    where: and(
      eq(restaurant.id, session.user.activeRestaurantId),
      eq(restaurant.ownerId, session.user.id),
    ),
    columns: {
      id: true,
      slug: true,
    },
  });

  if (!existingRestaurant) {
    return {
      success: false,
      error: "Restaurant not found",
    };
  }

  // only check if slug changed
  if (data.slug !== existingRestaurant.slug) {
    const slugExists = await db.query.restaurant.findFirst({
      where: eq(restaurant.slug, data.slug),
      columns: {
        id: true,
      },
    });

    if (slugExists) {
      return {
        success: false,
        error: "This URL is already taken",
      };
    }
  }

  const [updatedRestaurant] = await db
    .update(restaurant)
    .set({
      name: data.name,
      slug: data.slug,
      bio: data.bio,
      tagline: data.tagline,
      logo: data.logo[0] ?? null,
      updatedAt: new Date(),
    })
    .where(eq(restaurant.id, session.user.activeRestaurantId))
    .returning({
      name: restaurant.name,
      slug: restaurant.slug,
      bio: restaurant.bio,
      tagline: restaurant.tagline,
      logo: restaurant.logo,
    });

  logMerchantActivity(session.user, {
    type: "settings.business_updated",
    data: {},
  });

  return {
    success: true,
    data: updatedRestaurant,
  };
}
