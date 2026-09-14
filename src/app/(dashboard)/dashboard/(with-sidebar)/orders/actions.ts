"use server";

import { db } from "@/drizzle/db";
import { orders, orderStatusEnum, OrderStatus } from "@/drizzle/schema";
import { OrderWithItems } from "@/drizzle/types";
import { ensureAuthenticatedUserLean } from "@/lib/auth/guards";
import { ApiResponse } from "@/lib/types";
import { and, asc, desc, eq, gte, sql, SQL } from "drizzle-orm";
import { OrderChannel } from "./_components/utils";

export type TimelineRange = "today" | "7D" | "30D" | "90D";
export type OrdersSortBy = "recent" | "total" | "customer";

const PAGE_SIZE = 25;
const EXPORT_ROW_CAP = 10_000;
const BOARD_COLUMN_LIMIT = 30;

const BOARD_OLDEST_FIRST = new Set<OrderStatus>(["new", "confirmed", "preparing", "ready"]);

function rangeStartDate(range: TimelineRange | "all"): Date | null {
    const now = new Date();
    switch (range) {
        case "all":
            return null;
        case "today": {
            const d = new Date(now);
            d.setHours(0, 0, 0, 0);
            return d;
        }
        case "7D": {
            const d = new Date(now);
            d.setDate(d.getDate() - 7);
            return d;
        }
        case "30D": {
            const d = new Date(now);
            d.setDate(d.getDate() - 30);
            return d;
        }
        case "90D": {
            const d = new Date(now);
            d.setDate(d.getDate() - 90);
            return d;
        }
    }
}


export type OrdersSummary = {
    total: number;
    statusCounts: Record<OrderStatus, number>;
    revenue: number;
    avgOrderValue: number;
    pending: number;
    cancelRate: number;
};

export async function getOrdersSummary(range: TimelineRange = "today"): Promise<ApiResponse<OrdersSummary>> {
    try {
        const auth = await ensureAuthenticatedUserLean();
        if (!auth.session) {
            return auth.json;
        }
        const { activeRestaurantId } = auth.session.user;

        const startDate = rangeStartDate(range);
        const whereClause = startDate
            ? and(eq(orders.restaurantId, activeRestaurantId), gte(orders.createdAt, startDate))
            : eq(orders.restaurantId, activeRestaurantId);

        const [row] = await db
            .select({
                total: sql<number>`count(*)`,
                new: sql<number>`count(*) filter (where ${orders.status} = 'new')`,
                confirmed: sql<number>`count(*) filter (where ${orders.status} = 'confirmed')`,
                preparing: sql<number>`count(*) filter (where ${orders.status} = 'preparing')`,
                ready: sql<number>`count(*) filter (where ${orders.status} = 'ready')`,
                delivered: sql<number>`count(*) filter (where ${orders.status} = 'delivered')`,
                cancelled: sql<number>`count(*) filter (where ${orders.status} = 'cancelled')`,
                revenue: sql<number>`coalesce(sum(${orders.total}) filter (where ${orders.status} != 'cancelled'), 0)`,
                nonCancelled: sql<number>`count(*) filter (where ${orders.status} != 'cancelled')`,
                pending: sql<number>`count(*) filter (where ${orders.status} in ('new', 'preparing','ready','confirmed'))`,
            })
            .from(orders)
            .where(whereClause);

        const total = Number(row?.total ?? 0);
        const revenue = Number(row?.revenue ?? 0);
        const nonCancelled = Number(row?.nonCancelled ?? 0);
        const cancelled = Number(row?.cancelled ?? 0);

        return {
            success: true,
            data: {
                total,
                statusCounts: {
                    new: Number(row?.new ?? 0),
                    confirmed: Number(row?.confirmed ?? 0),
                    preparing: Number(row?.preparing ?? 0),
                    ready: Number(row?.ready ?? 0),
                    delivered: Number(row?.delivered ?? 0),
                    cancelled,
                },
                revenue,
                avgOrderValue: nonCancelled ? Math.round(revenue / nonCancelled) : 0,
                pending: Number(row?.pending ?? 0),
                cancelRate: total ? Math.round((cancelled / total) * 100) : 0,
            },
        };
    } catch (error) {
        console.error("Failed to fetch orders summary:", error);
        return { success: false, error: "Failed to fetch orders summary" };
    }
}

export type OrdersBoardData = Record<OrderStatus, OrderWithItems[]>;

export async function getOrdersBoard(range: TimelineRange = "today"): Promise<ApiResponse<OrdersBoardData>> {
    try {
        const auth = await ensureAuthenticatedUserLean();
        if (!auth.session) {
            return auth.json;
        }
        const { activeRestaurantId } = auth.session.user;
        const startDate = rangeStartDate(range);

        const columns = await Promise.all(
            orderStatusEnum.map((status) => {
                const conditions = [eq(orders.restaurantId, activeRestaurantId), eq(orders.status, status)];
                if (startDate) conditions.push(gte(orders.createdAt, startDate));

                return db.query.orders.findMany({
                    where: and(...conditions),
                    orderBy: BOARD_OLDEST_FIRST.has(status)
                        ? [asc(orders.createdAt), asc(orders.id)]
                        : [desc(orders.createdAt), desc(orders.id)],
                    limit: BOARD_COLUMN_LIMIT,
                    with: { items: true },
                });
            }),
        );

        const data = Object.fromEntries(
            orderStatusEnum.map((status, i) => [status, columns[i]]),
        ) as OrdersBoardData;

        return { success: true, data };
    } catch (error) {
        console.error("Failed to fetch orders board:", error);
        return { success: false, error: "Failed to fetch orders board" };
    }
}

export type OrdersListFilters = {
    range: TimelineRange;
    status?: OrderStatus | "all";
    channel?: OrderChannel | "all";
    search?: string;
    sortBy?: OrdersSortBy;
};

export type OrdersPage = {
    orders: OrderWithItems[];
    nextCursor: string | null;
    totalMatching: number | null;
};

function encodeCursor(sortBy: OrdersSortBy, o: OrderWithItems): string {
    if (sortBy === "total") return `${o.total}|${o.id}`;
    if (sortBy === "customer") return `${o.name}|${o.id}`;
    return `${new Date(o.createdAt).toISOString()}|${o.id}`;
}

type BaseOrderFilters = {
    range: TimelineRange | "all";
    status?: OrderStatus | "all";
    channel?: OrderChannel | "all";
    search?: string;
};

function buildFilterConditions(
    activeRestaurantId: string,
    filters: BaseOrderFilters,
): (SQL | undefined)[] {
    const { range, status = "all", channel = "all", search } = filters;
    const startDate = rangeStartDate(range);

    const conditions: (SQL | undefined)[] = [eq(orders.restaurantId, activeRestaurantId)];
    if (startDate) conditions.push(gte(orders.createdAt, startDate));
    if (status !== "all") conditions.push(eq(orders.status, status));
    if (channel !== "all") conditions.push(eq(orders.fulfillment, channel));
    if (search?.trim()) {
        const q = `%${search.trim()}%`;
        conditions.push(
            sql`(${orders.name} ILIKE ${q} OR ${orders.phone} ILIKE ${q} OR ${orders.orderNumber}::text ILIKE ${q})`,
        );
    }
    return conditions;
}

export async function getRestaurantOrdersPage(
    filters: OrdersListFilters,
    cursor: string | null = null,
): Promise<ApiResponse<OrdersPage>> {
    try {
        const auth = await ensureAuthenticatedUserLean();
        if (!auth.session) {
            return auth.json;
        }
        const { activeRestaurantId } = auth.session.user;
        const sortBy = filters.sortBy ?? "recent";

        const conditions = buildFilterConditions(activeRestaurantId, filters);

        if (cursor) {
            const sepIndex = cursor.lastIndexOf("|");
            const rawKey = cursor.slice(0, sepIndex);
            const id = cursor.slice(sepIndex + 1);
            if (sortBy === "total") {
                conditions.push(sql`(${orders.total}, ${orders.id}) < (${Number(rawKey)}, ${id})`);
            } else if (sortBy === "customer") {
                conditions.push(sql`(${orders.name}, ${orders.id}) > (${rawKey}, ${id})`);
            } else {
                conditions.push(sql`(${orders.createdAt}, ${orders.id}) < (${new Date(rawKey)}, ${id})`);
            }
        }

        const orderBy =
            sortBy === "total"
                ? [desc(orders.total), desc(orders.id)]
                : sortBy === "customer"
                    ? [asc(orders.name), asc(orders.id)]
                    : [desc(orders.createdAt), desc(orders.id)];

        const [rows, totalMatching] = await Promise.all([
            db.query.orders.findMany({
                where: and(...conditions),
                orderBy,
                limit: PAGE_SIZE + 1,
                with: { items: true },
            }),
            cursor
                ? Promise.resolve(null)
                : db
                    .select({ count: sql<number>`count(*)` })
                    .from(orders)
                    .where(and(...buildFilterConditions(activeRestaurantId, filters)))
                    .then((r) => Number(r[0]?.count ?? 0)),
        ]);

        const hasMore = rows.length > PAGE_SIZE;
        const pageRows = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
        const nextCursor = hasMore ? encodeCursor(sortBy, pageRows[pageRows.length - 1]) : null;

        return { success: true, data: { orders: pageRows, nextCursor, totalMatching } };
    } catch (error) {
        console.error("Failed to fetch orders:", error);
        return { success: false, error: "Failed to fetch orders" };
    }
}

export type OrderExportFilters = BaseOrderFilters;

export type OrderExportRow = {
    id: string;
    orderNumber: number;
    name: string;
    phone: string;
    fulfillment: OrderWithItems["fulfillment"];
    status: OrderStatus;
    total: string;
    currency: string;
    paymentReference: string | null;
    createdAt: Date;
};

export async function getOrdersExportCount(
    filters: OrderExportFilters,
): Promise<ApiResponse<{ count: number }>> {
    try {
        const auth = await ensureAuthenticatedUserLean();
        if (!auth.session) {
            return auth.json;
        }
        const { activeRestaurantId } = auth.session.user;
        const conditions = buildFilterConditions(activeRestaurantId, filters);

        const [row] = await db
            .select({ count: sql<number>`count(*)` })
            .from(orders)
            .where(and(...conditions));

        return { success: true, data: { count: Number(row?.count ?? 0) } };
    } catch (error) {
        console.error("Failed to count export rows:", error);
        return { success: false, error: "Failed to count matching orders" };
    }
}

export async function getOrdersForExport(
    filters: OrderExportFilters,
): Promise<ApiResponse<{ rows: OrderExportRow[]; truncated: boolean }>> {
    try {
        const auth = await ensureAuthenticatedUserLean();
        if (!auth.session) {
            return auth.json;
        }
        const { activeRestaurantId } = auth.session.user;
        const conditions = buildFilterConditions(activeRestaurantId, filters);

        const rows = await db
            .select({
                id: orders.id,
                orderNumber: orders.orderNumber,
                name: orders.name,
                phone: orders.phone,
                fulfillment: orders.fulfillment,
                status: orders.status,
                total: orders.total,
                currency: orders.currency,
                paymentReference: orders.paymentReference,
                createdAt: orders.createdAt,
            })
            .from(orders)
            .where(and(...conditions))
            .orderBy(desc(orders.createdAt))
            .limit(EXPORT_ROW_CAP + 1);

        const truncated = rows.length > EXPORT_ROW_CAP;
        return { success: true, data: { rows: truncated ? rows.slice(0, EXPORT_ROW_CAP) : rows, truncated } };
    } catch (error) {
        console.error("Failed to export orders:", error);
        return { success: false, error: "Failed to export orders" };
    }
}
