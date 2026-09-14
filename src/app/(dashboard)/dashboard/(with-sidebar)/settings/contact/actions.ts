"use server";

import { db } from "@/drizzle/db";
import { restaurant } from "@/drizzle/schema";
import { logMerchantActivity } from "@/lib/activity/log";
import { ensureAuthenticatedUser } from "@/lib/auth/guards";
import { ApiResponse } from "@/lib/types";
import { eq } from "drizzle-orm";
import { ContactInformationSchema, ContactInformationSchemaValues } from "./schema";

type updateRestaurantContactInfoAction = {
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
};

export async function updateRestaurantContactInfoAction(
  input: ContactInformationSchemaValues,
): Promise<ApiResponse<updateRestaurantContactInfoAction>> {
  const { session } = await ensureAuthenticatedUser();

  if (!session) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  const parsed = ContactInformationSchema.safeParse(input);

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
      email: data.email,
      address: data.address,
      phone: data.phone,
      website: data.website,
      updatedAt: new Date(),
    })
    .where(eq(restaurant.id, session.user.activeRestaurantId))
    .returning({
      email: restaurant.email,
      address: restaurant.address,
      phone: restaurant.phone,
      website: restaurant.website,
    });

  logMerchantActivity(session.user, {
    type: "settings.contact_updated",
    data: {},
  });

  return {
    success: true,
    data: updatedRestaurant,
  };
}
