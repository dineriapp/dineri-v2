"use server";

import { db } from "@/drizzle/db";
import { restaurant, user } from "@/drizzle/schema";
import { ensureAuthenticatedUserLean } from "@/lib/auth/guards";
import { ApiResponse } from "@/lib/types";
import { and, eq } from "drizzle-orm";

export async function switchActiveRestaurant(
    restaurantId: string
): Promise<ApiResponse<{ activeRestaurantId: string }>> {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) return auth.json;

    const owns = await db.query.restaurant.findFirst({
        where: and(eq(restaurant.id, restaurantId), eq(restaurant.ownerId, auth.session.user.id)),
        columns: { id: true },
    });

    if (!owns) {
        return { success: false, error: "Restaurant access denied" };
    }

    await db
        .update(user)
        .set({ activeRestaurantId: owns.id })
        .where(eq(user.id, auth.session.user.id));

    return { success: true, data: { activeRestaurantId: owns.id } };
}
