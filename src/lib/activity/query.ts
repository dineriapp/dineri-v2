import "server-only";

import { db } from "@/drizzle/db";
import { activityEvents } from "@/drizzle/schemas/activity-schema";
import { hasFeature } from "@/lib/stripe/checkers";
import type { PlanName } from "@/lib/types/plan-limits";
import { and, desc, eq, notInArray } from "drizzle-orm";
import {
    activityTypesInGroups,
    formatActivity,
    type ActivityEntry,
    type ActivityGroup,
} from "./definitions";

export const ACTIVITY_FEED_LIMIT = 20;

/**
 * Feed groups a plan can't produce anything for — hiding them keeps a Starter
 * venue from staring at an order section it never fills.
 */
function lockedGroups(plan: PlanName): ActivityGroup[] {
    const locked: ActivityGroup[] = [];
    if (!hasFeature(plan, "orderSystem")) locked.push("order");
    if (!hasFeature(plan, "reservations")) locked.push("reservation");
    return locked;
}

export async function getRecentActivity(params: {
    restaurantId: string;
    plan: PlanName;
    limit?: number;
}): Promise<ActivityEntry[]> {
    const { restaurantId, plan, limit = ACTIVITY_FEED_LIMIT } = params;

    const hiddenTypes = activityTypesInGroups(lockedGroups(plan));

    const rows = await db
        .select({
            id: activityEvents.id,
            type: activityEvents.type,
            data: activityEvents.data,
            actorName: activityEvents.actorName,
            source: activityEvents.source,
            createdAt: activityEvents.createdAt,
        })
        .from(activityEvents)
        .where(
            and(
                eq(activityEvents.restaurantId, restaurantId),
                hiddenTypes.length ? notInArray(activityEvents.type, hiddenTypes) : undefined
            )
        )
        .orderBy(desc(activityEvents.createdAt))
        .limit(limit);

    return rows
        .map(formatActivity)
        .filter((entry): entry is ActivityEntry => entry !== null);
}
