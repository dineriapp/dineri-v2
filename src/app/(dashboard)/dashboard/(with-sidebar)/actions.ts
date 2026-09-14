"use server";

import { db } from "@/drizzle/db";
import { orders, reservations, restaurant } from "@/drizzle/schema";
import { OrderStatus } from "@/drizzle/schemas/order-schema";
import { LinkType } from "@/drizzle/types";
import type { ActivityEntry } from "@/lib/activity/definitions";
import { getRecentActivity } from "@/lib/activity/query";
import { analytics, AnalyticsEventType } from "@/lib/analytics/analytics";
import { ensureAuthenticatedUser } from "@/lib/auth/guards";
import { GooglePlaceRating } from "@/lib/google/places";
import { getAnalyticsRetentionDays } from "@/lib/stripe/checkers";
import { ApiResponse } from "@/lib/types";
import { and, eq, gte, sql } from "drizzle-orm";
import { getRestaurantLinks } from "./links/actions";
import { getOrdersSummary, TimelineRange } from "./orders/actions";
import { getReservationsSummary, ReservationGroupId } from "./reservations/_components/dashboard/actions";
import { getActiveRestaurantGoogleRating } from "./settings/integrations/actions";

export type OverviewRange = Exclude<TimelineRange, "today">;
const RANGE_DAYS: Record<OverviewRange, number> = { "7D": 7, "30D": 30, "90D": 90 };

function pctDelta(current: number, previous: number): number | null {
    if (previous === 0) return current > 0 ? 100 : null;
    return Math.round(((current - previous) / previous) * 100);
}

function addDays(date: Date, delta: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    return d;
}

function startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function dayKey(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function sum(values: number[]): number {
    return values.reduce((a, b) => a + b, 0);
}

function buildDailyBuckets(totalDays: number, endDate: Date): string[] {
    const start = startOfDay(endDate);
    return Array.from({ length: totalDays }, (_, i) => dayKey(addDays(start, i - (totalDays - 1))));
}

async function getOrdersDailySeries(activeRestaurantId: string, n: number) {
    const now = new Date();
    const windowStart = addDays(startOfDay(now), -(2 * n - 1));

    const rows = await db
        .select({
            day: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`,
            count: sql<number>`count(*) filter (where ${orders.status} != 'cancelled')`,
            revenue: sql<number>`coalesce(sum(${orders.total}) filter (where ${orders.status} != 'cancelled'), 0)`,
        })
        .from(orders)
        .where(and(eq(orders.restaurantId, activeRestaurantId), gte(orders.createdAt, windowStart)))
        .groupBy(sql`date_trunc('day', ${orders.createdAt})`);

    const map = new Map(rows.map((r) => [r.day, r]));
    const buckets = buildDailyBuckets(2 * n, now);
    const revenueSeries = buckets.map((d) => Number(map.get(d)?.revenue ?? 0));
    const countSeries = buckets.map((d) => Number(map.get(d)?.count ?? 0));

    const previousRevenue = sum(revenueSeries.slice(0, n));
    const currentRevenue = sum(revenueSeries.slice(n));
    const previousCount = sum(countSeries.slice(0, n));
    const currentCount = sum(countSeries.slice(n));

    return {
        revenueDeltaPct: pctDelta(currentRevenue, previousRevenue),
        countDeltaPct: pctDelta(currentCount, previousCount),
        sparkline: revenueSeries.slice(n),
    };
}

async function getEventTrend(slug: string, type: AnalyticsEventType, n: number, maxRetentionDays: number) {
    const current = await analytics.getDashboardData(slug, type, String(n), n);

    let deltaPct: number | null = null;
    const totalDays = Math.min(2 * n, maxRetentionDays);
    if (totalDays > n) {
        const doubled = await analytics.getDashboardData(slug, type, String(totalDays), totalDays);
        const previousDays = doubled.days.slice(0, totalDays - n);
        const previousTotal = previousDays.reduce((s, d) => s + d.total, 0);
        deltaPct = pctDelta(current.totalVisits, previousTotal);
    }

    return {
        total: current.totalVisits,
        uniqueVisitors: current.uniqueVisitors,
        deltaPct,
        sparkline: current.days.map((d) => d.total),
        topCountries: current.topCountries,
        topCities: current.topCities,
        deviceBreakdown: current.deviceBreakdown,
        trafficSources: current.trafficSources,
    };
}

async function getReservationsCreatedTrend(activeRestaurantId: string, n: number): Promise<number | null> {
    const now = new Date();
    const windowStart = addDays(startOfDay(now), -(2 * n - 1));

    const rows = await db
        .select({
            day: sql<string>`to_char(date_trunc('day', ${reservations.createdAt}), 'YYYY-MM-DD')`,
            count: sql<number>`count(*) filter (where ${reservations.status} != 'cancelled')`,
        })
        .from(reservations)
        .where(and(eq(reservations.restaurantId, activeRestaurantId), gte(reservations.createdAt, windowStart)))
        .groupBy(sql`date_trunc('day', ${reservations.createdAt})`);

    const map = new Map(rows.map((r) => [r.day, r]));
    const buckets = buildDailyBuckets(2 * n, now);
    const countSeries = buckets.map((d) => Number(map.get(d)?.count ?? 0));

    const previousCount = sum(countSeries.slice(0, n));
    const currentCount = sum(countSeries.slice(n));

    return pctDelta(currentCount, previousCount);
}

export type DashboardOverview = {
    range: OverviewRange;
    today: {
        ordersCount: number;
        ordersRevenue: number;
        ordersPending: number;
        reservationsToday: number;
        reservationsCovers: number;
        reservationsAwaiting: number;
    };
    orders: {
        total: number;
        revenue: number;
        avgOrderValue: number;
        cancelRate: number;
        statusCounts: Record<OrderStatus, number>;
        revenueDeltaPct: number | null;
        countDeltaPct: number | null;
        sparkline: number[];
    };
    reservations: {
        total: number;
        covers: number;
        groupCounts: Record<ReservationGroupId, number>;
        newBookingsDeltaPct: number | null;
    };
    visitors: {
        total: number;
        uniqueVisitors: number;
        deltaPct: number | null;
        sparkline: number[];
        topCountries: [string, number][];
        topCities: [string, number][];
        deviceBreakdown: [string, number][];
        trafficSources: [string, number][];
    };
    menuViews: {
        total: number;
        deltaPct: number | null;
        sparkline: number[];
    };
    rating: GooglePlaceRating | null;
    topLinks: LinkType[];
    recentActivity: ActivityEntry[];
};

const EMPTY_RESERVATION_GROUP_COUNTS: Record<ReservationGroupId, number> = {
    awaiting: 0,
    confirmed: 0,
    seated: 0,
    completed: 0,
    cancelled: 0,
    no_show: 0,
};

const EMPTY_EVENT_TREND = {
    total: 0,
    uniqueVisitors: 0,
    deltaPct: null as number | null,
    sparkline: [] as number[],
    topCountries: [] as [string, number][],
    topCities: [] as [string, number][],
    deviceBreakdown: [] as [string, number][],
    trafficSources: [] as [string, number][],
};

export async function getDashboardOverview(range: OverviewRange): Promise<ApiResponse<DashboardOverview>> {
    try {
        const auth = await ensureAuthenticatedUser();
        if (!auth.session) {
            return { success: false, error: "Login required." };
        }

        const { activeRestaurantId, subscription } = auth.session.user;
        const n = RANGE_DAYS[range];
        const maxRetentionDays = getAnalyticsRetentionDays(subscription.plan);

        const now = new Date();
        const todayStr = dayKey(now);
        // Reservations are booked for future service dates, so "range" looks forward from
        // today (upcoming covers) rather than backward like orders/visitors history.
        const upcomingToStr = dayKey(addDays(now, n - 1));

        const restaurantRow = await db.query.restaurant.findFirst({
            where: eq(restaurant.id, activeRestaurantId),
            columns: { slug: true },
        });
        const slug = restaurantRow?.slug ?? "";

        const [
            todayOrders,
            todayReservations,
            ordersSummaryRange,
            ordersDaily,
            reservationsUpcoming,
            reservationsNewBookingsDeltaPct,
            visitorsTrend,
            menuViewsTrend,
            ratingRes,
            linksRes,
            recentActivity,
        ] = await Promise.all([
            getOrdersSummary("today"),
            getReservationsSummary({ from: todayStr, to: todayStr }),
            getOrdersSummary(range),
            getOrdersDailySeries(activeRestaurantId, n),
            getReservationsSummary({ from: todayStr, to: upcomingToStr }),
            getReservationsCreatedTrend(activeRestaurantId, n),
            slug ? getEventTrend(slug, "pageview", n, maxRetentionDays) : Promise.resolve(EMPTY_EVENT_TREND),
            slug ? getEventTrend(slug, "menu", n, maxRetentionDays) : Promise.resolve(EMPTY_EVENT_TREND),
            getActiveRestaurantGoogleRating(),
            getRestaurantLinks(),
            getRecentActivity({ restaurantId: activeRestaurantId, plan: subscription.plan }),
        ]);

        const todayOrdersData = todayOrders.success
            ? todayOrders.data
            : { total: 0, statusCounts: {} as Record<OrderStatus, number>, revenue: 0, avgOrderValue: 0, pending: 0, cancelRate: 0 };
        const todayReservationsData = todayReservations.success
            ? todayReservations.data
            : { total: 0, covers: 0, groupCounts: EMPTY_RESERVATION_GROUP_COUNTS };
        const ordersRangeData = ordersSummaryRange.success
            ? ordersSummaryRange.data
            : { total: 0, statusCounts: {} as Record<OrderStatus, number>, revenue: 0, avgOrderValue: 0, pending: 0, cancelRate: 0 };
        const reservationsUpcomingData = reservationsUpcoming.success
            ? reservationsUpcoming.data
            : { total: 0, covers: 0, groupCounts: EMPTY_RESERVATION_GROUP_COUNTS };

        const data: DashboardOverview = {
            range,
            today: {
                ordersCount: todayOrdersData.total - (todayOrdersData.statusCounts.cancelled ?? 0),
                ordersRevenue: todayOrdersData.revenue,
                ordersPending: todayOrdersData.pending,
                reservationsToday: todayReservationsData.total,
                reservationsCovers: todayReservationsData.covers,
                reservationsAwaiting: todayReservationsData.groupCounts.awaiting,
            },
            orders: {
                total: ordersRangeData.total,
                revenue: ordersRangeData.revenue,
                avgOrderValue: ordersRangeData.avgOrderValue,
                cancelRate: ordersRangeData.cancelRate,
                statusCounts: ordersRangeData.statusCounts,
                revenueDeltaPct: ordersDaily.revenueDeltaPct,
                countDeltaPct: ordersDaily.countDeltaPct,
                sparkline: ordersDaily.sparkline,
            },
            reservations: {
                total: reservationsUpcomingData.total,
                covers: reservationsUpcomingData.covers,
                groupCounts: reservationsUpcomingData.groupCounts,
                newBookingsDeltaPct: reservationsNewBookingsDeltaPct,
            },
            visitors: {
                total: visitorsTrend.total,
                uniqueVisitors: visitorsTrend.uniqueVisitors,
                deltaPct: visitorsTrend.deltaPct,
                sparkline: visitorsTrend.sparkline,
                topCountries: visitorsTrend.topCountries,
                topCities: visitorsTrend.topCities,
                deviceBreakdown: visitorsTrend.deviceBreakdown,
                trafficSources: visitorsTrend.trafficSources,
            },
            menuViews: {
                total: menuViewsTrend.total,
                deltaPct: menuViewsTrend.deltaPct,
                sparkline: menuViewsTrend.sparkline,
            },
            rating: ratingRes.success ? ratingRes.data : null,
            topLinks: linksRes.success ? linksRes.data : [],
            recentActivity,
        };

        return { success: true, data };
    } catch (error) {
        console.error("Failed to fetch dashboard overview:", error);
        return { success: false, error: "Failed to fetch dashboard overview" };
    }
}
