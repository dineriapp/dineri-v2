import { db } from "@/drizzle/db";
import { restaurant, subscription } from "@/drizzle/schema";
import { and, eq, or } from "drizzle-orm";
import { cache } from "react";
import { PlanName } from "./plans";


export const getRestaurantOwnerPlan = cache(async (restaurantId: string): Promise<PlanName> => {
    const restaurantData = await db.query.restaurant.findFirst({
        where: eq(restaurant.id, restaurantId),
        columns: { ownerId: true },
    });

    if (!restaurantData?.ownerId) {
        return "starter";
    }

    const activeSubscription = await db.query.subscription.findFirst({
        where: and(
            eq(subscription.referenceId, restaurantData.ownerId),
            or(
                eq(subscription.status, "active"),
                eq(subscription.status, "trialing")
            )
        ),
        columns: { plan: true },
    });

    return (activeSubscription?.plan as PlanName) ?? "starter";
});