import "server-only";

import { db } from "@/drizzle/db";
import { activityEvents } from "@/drizzle/schemas/activity-schema";
import type { ActivitySource } from "@/drizzle/schemas/activity-schema";
import { and, desc, eq, gte, isNull } from "drizzle-orm";
import { after } from "next/server";
import {
    ACTIVITY_DEFINITIONS,
    type ActivityPayload,
    type ActivityType,
    type AnyActivityDefinition,
} from "./definitions";

export type ActivityActor = {
    userId: string | null;
    name: string | null;
    source: ActivitySource;
};

/** A signed-in staff member acting from the dashboard. */
export function merchantActor(user: { id: string; name?: string | null }): ActivityActor {
    return { userId: user.id, name: user.name ?? null, source: "merchant" };
}

/** A diner acting from the public venue page. */
export function guestActor(name?: string | null): ActivityActor {
    return { userId: null, name: name ?? null, source: "guest" };
}

/** The platform itself — webhooks, crons, scheduled jobs. */
export const SYSTEM_ACTOR: ActivityActor = { userId: null, name: null, source: "system" };

export type LogActivityInput<TType extends ActivityType> = {
    restaurantId: string;
    actor: ActivityActor;
    type: TType;
    data: ActivityPayload<TType>;
    /** The record this event is about, for future deep links. */
    entityId?: string | null;
};

/**
 * Records one activity feed event.
 *
 * Fire-and-forget by design: the write is deferred until after the response has
 * been sent and every failure is swallowed, so a feed problem can never break
 * the mutation that produced it.
 */
export function logActivity<TType extends ActivityType>(input: LogActivityInput<TType>): void {
    try {
        after(() => persist(input));
    } catch {
        // Outside a request scope (scripts, tests) `after` is unavailable.
        void persist(input);
    }
}

type SessionUser = { id: string; name?: string | null; activeRestaurantId: string };

/**
 * Shorthand for the overwhelmingly common case: signed-in staff acting on the
 * venue they have selected. Saves repeating the actor and venue at every call.
 */
export function logMerchantActivity<TType extends ActivityType>(
    user: SessionUser,
    input: Omit<LogActivityInput<TType>, "restaurantId" | "actor">
): void {
    logActivity({ ...input, restaurantId: user.activeRestaurantId, actor: merchantActor(user) });
}

async function persist<TType extends ActivityType>(input: LogActivityInput<TType>): Promise<void> {
    try {
        const { restaurantId, actor, type, data, entityId } = input;
        const definition: AnyActivityDefinition = ACTIVITY_DEFINITIONS[type];
        const { coalesceMinutes } = definition;

        if (coalesceMinutes && (await mergeIntoRecent(input, coalesceMinutes))) return;

        await db.insert(activityEvents).values({
            restaurantId,
            actorUserId: actor.userId,
            actorName: actor.name,
            source: actor.source,
            type,
            entityId: entityId ?? null,
            data,
        });
    } catch (error) {
        console.error(`Failed to log activity "${input.type}":`, error);
    }
}

/**
 * Folds a repeat of a chatty event (autosaving editors) into the most recent
 * matching row instead of adding another one. Returns whether it merged.
 */
async function mergeIntoRecent<TType extends ActivityType>(
    input: LogActivityInput<TType>,
    windowMinutes: number
): Promise<boolean> {
    const { restaurantId, actor, type, data } = input;
    const since = new Date(Date.now() - windowMinutes * 60_000);

    const [recent] = await db
        .select({ id: activityEvents.id })
        .from(activityEvents)
        .where(
            and(
                eq(activityEvents.restaurantId, restaurantId),
                eq(activityEvents.type, type),
                actor.userId
                    ? eq(activityEvents.actorUserId, actor.userId)
                    : isNull(activityEvents.actorUserId),
                gte(activityEvents.createdAt, since)
            )
        )
        .orderBy(desc(activityEvents.createdAt))
        .limit(1);

    if (!recent) return false;

    await db
        .update(activityEvents)
        .set({ data, createdAt: new Date() })
        .where(eq(activityEvents.id, recent.id));

    return true;
}
