"use server";

import { db } from "@/drizzle/db";
import { restaurant } from "@/drizzle/schema";
import { ensureAuthenticatedUserLean } from "@/lib/auth/guards";
import { ApiResponse } from "@/lib/types";
import { eq } from "drizzle-orm";

export type UserRestaurant = {
    id: string;
    name: string;
    slug: string;
};

export async function getUserRestaurants(): Promise<ApiResponse<UserRestaurant[]>> {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) return auth.json;

    const restaurants = await db.query.restaurant.findMany({
        where: eq(restaurant.ownerId, auth.session.user.id),
        columns: { id: true, name: true, slug: true },
    });

    return { success: true, data: restaurants };
}
