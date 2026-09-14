"use server";

import slugify from "slugify";
import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { restaurant } from "@/drizzle/schema";
import { limitAnonymousAction } from "@/lib/rate-limit/guard";

export const checkRestaurantSlug = async (name: string) => {
    const slug = slugify(name, {
        lower: true,
        strict: true,
        trim: true,
    });

    const limit = await limitAnonymousAction("check-restaurant-slug", "slugCheck");
    if (!limit.allowed) {
        return { slug, exists: false, rateLimited: true };
    }

    const existingRestaurant = await db.query.restaurant.findFirst({
        where: eq(restaurant.slug, slug),
        columns: {
            id: true,
        },
    });

    return {
        slug,
        exists: !!existingRestaurant,
        rateLimited: false,
    };
};
