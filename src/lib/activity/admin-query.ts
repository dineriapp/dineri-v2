import "server-only";

import { db } from "@/drizzle/db";
import { activityEvents } from "@/drizzle/schemas/activity-schema";
import { restaurant } from "@/drizzle/schemas/restaurant-schema";
import { and, count, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import {
    activityTypesInGroups,
    formatActivity,
    type ActivityEntry,
    type ActivityGroup,
} from "./definitions";

/**
 * Platform-admin views over the activity feed. Unlike the merchant query these
 * span every venue and never hide groups by plan — an admin looks at what
 * actually happened, not at what a subscription entitles them to see.
 */

export const ADMIN_ACTIVITY_PAGE_SIZE = 25;
export const ADMIN_RESTAURANTS_PAGE_SIZE = 20;

export type Page<T> = {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    pageCount: number;
};

export type VenueRef = { id: string; name: string; slug: string };

export type SiteActivityEntry = ActivityEntry & { venue: VenueRef };

export type SiteActivityFilters = {
    page?: number;
    restaurantId?: string;
    group?: ActivityGroup;
    search?: string;
};

function toPage<T>(items: T[], total: number, page: number, pageSize: number): Page<T> {
    return {
        items,
        total,
        page,
        pageSize,
        pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
}

/** Clamps a user-supplied page number into the valid range. */
export function normalizePage(value: string | undefined, pageCount = Infinity): number {
    const parsed = Number.parseInt(value ?? "1", 10);
    if (!Number.isFinite(parsed) || parsed < 1) return 1;
    return Math.min(parsed, pageCount);
}

function activityConditions(filters: SiteActivityFilters): SQL[] {
    const conditions: SQL[] = [];

    if (filters.restaurantId) {
        conditions.push(eq(activityEvents.restaurantId, filters.restaurantId));
    }

    if (filters.group) {
        const types = activityTypesInGroups([filters.group]);
        if (types.length) conditions.push(inArray(activityEvents.type, types));
    }

    const search = filters.search?.trim();
    if (search) {
        const term = `%${search}%`;
        const match = or(
            ilike(restaurant.name, term),
            ilike(restaurant.slug, term),
            ilike(activityEvents.actorName, term)
        );
        if (match) conditions.push(match);
    }

    return conditions;
}

export async function getSiteActivityPage(
    filters: SiteActivityFilters = {}
): Promise<Page<SiteActivityEntry>> {
    const pageSize = ADMIN_ACTIVITY_PAGE_SIZE;
    const conditions = activityConditions(filters);
    const where = conditions.length ? and(...conditions) : undefined;

    const [totals] = await db
        .select({ total: count() })
        .from(activityEvents)
        .innerJoin(restaurant, eq(activityEvents.restaurantId, restaurant.id))
        .where(where);

    const total = totals?.total ?? 0;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(Math.max(filters.page ?? 1, 1), pageCount);

    const rows = await db
        .select({
            id: activityEvents.id,
            type: activityEvents.type,
            data: activityEvents.data,
            actorName: activityEvents.actorName,
            source: activityEvents.source,
            createdAt: activityEvents.createdAt,
            venueId: restaurant.id,
            venueName: restaurant.name,
            venueSlug: restaurant.slug,
        })
        .from(activityEvents)
        .innerJoin(restaurant, eq(activityEvents.restaurantId, restaurant.id))
        .where(where)
        .orderBy(desc(activityEvents.createdAt), desc(activityEvents.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

    const items = rows.flatMap((row) => {
        const entry = formatActivity(row);
        if (!entry) return [];
        return [
            {
                ...entry,
                venue: { id: row.venueId, name: row.venueName, slug: row.venueSlug },
            },
        ];
    });

    return toPage(items, total, page, pageSize);
}

export type SiteActivityStats = {
    total: number;
    last24h: number;
    last7d: number;
    activeVenues: number;
};

export async function getSiteActivityStats(restaurantId?: string): Promise<SiteActivityStats> {
    const scope = restaurantId ? eq(activityEvents.restaurantId, restaurantId) : undefined;
    const since = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000);

    const [row] = await db
        .select({
            total: count(),
            last24h: sql<number>`count(*) filter (
                where ${activityEvents.createdAt} >= ${since(24)}
            )`,
            last7d: sql<number>`count(*) filter (
                where ${activityEvents.createdAt} >= ${since(24 * 7)}
            )`,
            activeVenues: sql<number>`count(distinct ${activityEvents.restaurantId})`,
        })
        .from(activityEvents)
        .where(scope);

    return {
        total: Number(row?.total ?? 0),
        last24h: Number(row?.last24h ?? 0),
        last7d: Number(row?.last7d ?? 0),
        activeVenues: Number(row?.activeVenues ?? 0),
    };
}

export type ActivityVenueRow = VenueRef & {
    total: number;
    last7d: number;
    lastActivityAt: Date | null;
};

/**
 * Every venue on the platform with its activity counts — venues that have done
 * nothing yet are included, so the list doubles as a "who is dormant" view.
 */
export async function getActivityVenuesPage(params: {
    page?: number;
    search?: string;
}): Promise<Page<ActivityVenueRow>> {
    const pageSize = ADMIN_RESTAURANTS_PAGE_SIZE;
    const search = params.search?.trim();
    const where = search
        ? or(ilike(restaurant.name, `%${search}%`), ilike(restaurant.slug, `%${search}%`))
        : undefined;

    const [totals] = await db.select({ total: count() }).from(restaurant).where(where);

    const total = totals?.total ?? 0;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(Math.max(params.page ?? 1, 1), pageCount);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const rows = await db
        .select({
            id: restaurant.id,
            name: restaurant.name,
            slug: restaurant.slug,
            total: count(activityEvents.id),
            last7d: sql<number>`count(${activityEvents.id}) filter (
                where ${activityEvents.createdAt} >= ${weekAgo}
            )`,
            lastActivityAt: sql<Date | null>`max(${activityEvents.createdAt})`,
        })
        .from(restaurant)
        .leftJoin(activityEvents, eq(activityEvents.restaurantId, restaurant.id))
        .where(where)
        .groupBy(restaurant.id, restaurant.name, restaurant.slug)
        .orderBy(sql`max(${activityEvents.createdAt}) desc nulls last`, restaurant.name)
        .limit(pageSize)
        .offset((page - 1) * pageSize);

    const items = rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        total: Number(r.total ?? 0),
        last7d: Number(r.last7d ?? 0),
        lastActivityAt: r.lastActivityAt ? new Date(r.lastActivityAt) : null,
    }));

    return toPage(items, total, page, pageSize);
}

export async function getVenue(id: string): Promise<VenueRef | null> {
    const row = await db.query.restaurant.findFirst({
        where: eq(restaurant.id, id),
        columns: { id: true, name: true, slug: true },
    });

    return row ?? null;
}
