"use server";

import { db } from "@/drizzle/db";
import { reservations } from "@/drizzle/schema";
import { ensureAuthenticatedUserLean } from "@/lib/auth/guards";
import { ApiResponse } from "@/lib/types";
import { and, desc, eq, gte, lte, sql, SQL } from "drizzle-orm";

const PAGE_SIZE = 25;

export type PaymentsFilters = {
  from: string;
  to: string;
};

function buildConditions(
  activeRestaurantId: string,
  filters: PaymentsFilters,
): (SQL | undefined)[] {
  return [
    eq(reservations.restaurantId, activeRestaurantId),
    gte(reservations.date, filters.from),
    lte(reservations.date, filters.to),
  ];
}

export type ReservationPaymentsSummary = {
  collected: number;
  pending: number;
  refunded: number;
  net: number;
  retainedFromLostCovers: number;
  refundedOnCancellations: number;
  abandoned: number;
  averageDeposit: number;
  rates: {
    refund: number;
    cancellation: number;
    noShow: number;
  };
  coversLost: number;
  counts: {
    total: number;
    paid: number;
    pending: number;
    refunded: number;
    partiallyRefunded: number;
    failed: number;
    free: number;
    cancelled: number;
    noShow: number;
  };
};

export async function getReservationPaymentsSummary(
  filters: PaymentsFilters,
): Promise<ApiResponse<ReservationPaymentsSummary>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }
    const { activeRestaurantId } = auth.session.user;

    const notFailed = sql`${reservations.paymentStatus} <> 'failed'`;
    const lostCover = sql`${reservations.status} in ('cancelled', 'no_show')`;

    const [row] = await db
      .select({
        collected: sql<string>`coalesce(sum(${reservations.paidAmount}), 0)`,
        pending: sql<string>`coalesce(sum(${reservations.amount}) filter (where ${reservations.paymentStatus} = 'pending'), 0)`,
        refunded: sql<string>`coalesce(sum(${reservations.refundedAmount}), 0)`,

        retained: sql<string>`coalesce(sum(${reservations.paidAmount} - ${reservations.refundedAmount}) filter (where ${lostCover}), 0)`,
        refundedOnCancellations: sql<string>`coalesce(sum(${reservations.refundedAmount}) filter (where ${reservations.status} = 'cancelled'), 0)`,
        abandoned: sql<string>`coalesce(sum(${reservations.amount}) filter (where ${reservations.paymentStatus} = 'failed'), 0)`,

        total: sql<number>`count(*) filter (where ${notFailed})`,
        paidCount: sql<number>`count(*) filter (where ${reservations.paymentStatus} = 'paid')`,
        pendingCount: sql<number>`count(*) filter (where ${reservations.paymentStatus} = 'pending')`,
        refundedCount: sql<number>`count(*) filter (where ${reservations.refundedAmount} > 0 and ${reservations.refundedAmount} >= ${reservations.paidAmount})`,
        partialCount: sql<number>`count(*) filter (where ${reservations.refundedAmount} > 0 and ${reservations.refundedAmount} < ${reservations.paidAmount})`,
        failedCount: sql<number>`count(*) filter (where ${reservations.paymentStatus} = 'failed')`,
        freeCount: sql<number>`count(*) filter (where ${reservations.paymentStatus} = 'free')`,
        cancelledCount: sql<number>`count(*) filter (where ${reservations.status} = 'cancelled' and ${notFailed})`,
        noShowCount: sql<number>`count(*) filter (where ${reservations.status} = 'no_show')`,
        coversLost: sql<number>`coalesce(sum(${reservations.partySize}) filter (where ${lostCover} and ${notFailed}), 0)`,
      })
      .from(reservations)
      .where(and(...buildConditions(activeRestaurantId, filters)));

    const collected = Number(row?.collected ?? 0);
    const refunded = Number(row?.refunded ?? 0);
    const paidCount = Number(row?.paidCount ?? 0);
    const total = Number(row?.total ?? 0);

    const pct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);

    return {
      success: true,
      data: {
        collected,
        pending: Number(row?.pending ?? 0),
        refunded,
        net: collected - refunded,
        retainedFromLostCovers: Number(row?.retained ?? 0),
        refundedOnCancellations: Number(row?.refundedOnCancellations ?? 0),
        abandoned: Number(row?.abandoned ?? 0),
        averageDeposit: paidCount > 0 ? collected / paidCount : 0,
        rates: {
          refund: pct(refunded, collected),
          cancellation: pct(Number(row?.cancelledCount ?? 0), total),
          noShow: pct(Number(row?.noShowCount ?? 0), total),
        },
        coversLost: Number(row?.coversLost ?? 0),
        counts: {
          total,
          paid: paidCount,
          pending: Number(row?.pendingCount ?? 0),
          refunded: Number(row?.refundedCount ?? 0),
          partiallyRefunded: Number(row?.partialCount ?? 0),
          failed: Number(row?.failedCount ?? 0),
          free: Number(row?.freeCount ?? 0),
          cancelled: Number(row?.cancelledCount ?? 0),
          noShow: Number(row?.noShowCount ?? 0),
        },
      },
    };
  } catch (error) {
    console.error("Failed to fetch reservation payments summary:", error);
    return { success: false, error: "Failed to fetch payment totals" };
  }
}

export type ReservationPaymentRow = {
  id: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  date: string;
  time: string;
  partySize: number;
  amount: string;
  paidAmount: string;
  refundedAmount: string;
  refundedAt: Date | null;
  refundReason: string | null;
  currency: string | null;
  paymentStatus: string;
  status: string;
  paymentReference: string | null;
  note: string | null;
  areaName: string | null;
  tables: string[];
  isPriorityReservation: boolean;
};

export type ReservationPaymentsPage = {
  rows: ReservationPaymentRow[];
  nextCursor: string | null;
};

const encodeCursor = (r: { date: string; time: string; id: string }) =>
  `${r.date}|${r.time}|${r.id}`;

export async function getReservationPaymentsPage(
  filters: PaymentsFilters,
  cursor: string | null = null,
): Promise<ApiResponse<ReservationPaymentsPage>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }
    const { activeRestaurantId } = auth.session.user;

    const conditions = buildConditions(activeRestaurantId, filters);

    if (cursor) {
      const [date, time, id] = cursor.split("|");
      conditions.push(
        sql`(${reservations.date}, ${reservations.time}, ${reservations.id}) < (${date}::date, ${time}::time, ${id}::uuid)`,
      );
    }

    const found = await db.query.reservations.findMany({
      where: and(...conditions),
      columns: {
        id: true,
        guestName: true,
        guestPhone: true,
        guestEmail: true,
        date: true,
        time: true,
        partySize: true,
        amount: true,
        paidAmount: true,
        refundedAmount: true,
        refundedAt: true,
        refundReason: true,
        currency: true,
        paymentStatus: true,
        status: true,
        paymentReference: true,
        note: true,
        assignedTables: true,
        isPriorityReservation: true,
      },
      with: { area: { columns: { name: true } } },
      orderBy: [desc(reservations.date), desc(reservations.time), desc(reservations.id)],
      limit: PAGE_SIZE + 1,
    });

    const hasMore = found.length > PAGE_SIZE;
    const pageRows = hasMore ? found.slice(0, PAGE_SIZE) : found;

    return {
      success: true,
      data: {
        rows: pageRows.map((r) => ({
          id: r.id,
          guestName: r.guestName,
          guestPhone: r.guestPhone,
          guestEmail: r.guestEmail,
          date: r.date,
          time: r.time,
          partySize: r.partySize,
          amount: r.amount,
          paidAmount: r.paidAmount,
          refundedAmount: r.refundedAmount,
          refundedAt: r.refundedAt,
          refundReason: r.refundReason,
          currency: r.currency,
          paymentStatus: r.paymentStatus,
          status: r.status,
          paymentReference: r.paymentReference,
          note: r.note,
          areaName: r.area?.name ?? null,
          tables: r.assignedTables.map((t) => t.label),
          isPriorityReservation: r.isPriorityReservation,
        })),
        nextCursor: hasMore ? encodeCursor(pageRows[pageRows.length - 1]) : null,
      },
    };
  } catch (error) {
    console.error("Failed to fetch reservation payments:", error);
    return { success: false, error: "Failed to fetch payments" };
  }
}

const CSV_COLUMNS = [
  "Date",
  "Time",
  "Guest",
  "Email",
  "Phone",
  "Party size",
  "Area",
  "Tables",
  "Booking status",
  "Payment status",
  "Currency",
  "Quoted",
  "Collected",
  "Refunded",
  "Net",
  "Refunded at",
  "Refund reason",
  "Stripe reference",
] as const;

function csvCell(value: unknown): string {
  const raw = value === null || value === undefined ? "" : String(value);
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function exportReservationPaymentsAction(
  filters: PaymentsFilters,
): Promise<ApiResponse<{ csv: string; filename: string }>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }
    const { activeRestaurantId } = auth.session.user;

    const rows = await db.query.reservations.findMany({
      where: and(...buildConditions(activeRestaurantId, filters)),
      columns: {
        date: true,
        time: true,
        guestName: true,
        guestEmail: true,
        guestPhone: true,
        partySize: true,
        assignedTables: true,
        status: true,
        paymentStatus: true,
        currency: true,
        amount: true,
        paidAmount: true,
        refundedAmount: true,
        refundedAt: true,
        refundReason: true,
        paymentReference: true,
      },
      with: { area: { columns: { name: true } } },
      orderBy: [desc(reservations.date), desc(reservations.time)],
    });

    const lines = [
      CSV_COLUMNS.join(","),
      ...rows.map((r) =>
        [
          r.date,
          r.time.slice(0, 5),
          r.guestName,
          r.guestEmail,
          r.guestPhone,
          r.partySize,
          r.area?.name ?? "",
          r.assignedTables.map((t) => t.label).join(" "),
          r.status,
          r.paymentStatus,
          r.currency ?? "",
          r.amount,
          r.paidAmount,
          r.refundedAmount,
          (Number(r.paidAmount) - Number(r.refundedAmount)).toFixed(2),
          r.refundedAt ? r.refundedAt.toISOString() : "",
          r.refundReason ?? "",
          r.paymentReference ?? "",
        ]
          .map(csvCell)
          .join(","),
      ),
    ];

    return {
      success: true,
      data: {
        csv: lines.join("\r\n"),
        filename: `reservation-payments_${filters.from}_${filters.to}.csv`,
      },
    };
  } catch (error) {
    console.error("Failed to export reservation payments:", error);
    return { success: false, error: "Failed to export payments" };
  }
}
