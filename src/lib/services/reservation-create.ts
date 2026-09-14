import "server-only";

import { db } from "@/drizzle/db";
import { reservations } from "@/drizzle/schema";
import type {
  ReservationPaymentStatus,
  ReservationStatus,
} from "@/drizzle/schemas/reservation-schema";
import { sql } from "drizzle-orm";
import { logActivity, type ActivityActor } from "@/lib/activity/log";
import { AssignedTable, checkReservationAvailability } from "./reservation-availability";
import { RESERVATIONS_NOT_ON_PLAN_ERROR, restaurantHasFeature } from "./restaurant-plan";

export type ReservationDetailsInput = {
  name: string;
  partySize: number;
  phone: string;
  email: string;
  date: string;
  time: string;
  notes?: string;
  areaId?: string;
};

export type CreateReservationRecordResult =
  | {
      ok: true;
      reservationId: string;
      areaId: string | null;
      assignedTables: AssignedTable[];
      requiresManualSeating: boolean;
    }
  | { ok: false; error: string };

export async function createReservationRecord(params: {
  restaurantId: string;
  input: ReservationDetailsInput;
  status: ReservationStatus;
  paymentStatus: ReservationPaymentStatus;
  amount: string;
  paidAmount?: string;
  currency?: string | null;
  paymentReference?: string | null;
  isPriority?: boolean;
  actor: ActivityActor;
}): Promise<CreateReservationRecordResult> {
  const { restaurantId, input, status, paymentStatus, amount } = params;
  const { name, partySize, phone, email, date, time, notes, areaId } = input;

  if (!(await restaurantHasFeature(restaurantId, "reservations"))) {
    return { ok: false as const, error: RESERVATIONS_NOT_ON_PLAN_ERROR };
  }

  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`reservation:${restaurantId}:${date}`}))`,
    );

    const availability = await checkReservationAvailability({
      restaurantId,
      date,
      time,
      partySize,
      areaId: areaId || null,
      isPriority: params.isPriority,
    });

    if (!availability.available) {
      return { ok: false as const, error: availability.message };
    }

    const [reservation] = await tx
      .insert(reservations)
      .values({
        restaurantId,
        areaId: availability.area?.id ?? null,
        assignedTables: availability.assignedTables,
        guestName: name,
        guestPhone: phone,
        guestEmail: email,
        partySize,
        date,
        time,
        note: notes || null,
        status,
        paymentStatus,
        paymentReference: params.paymentReference ?? null,
        amount,
        paidAmount: params.paidAmount ?? "0",
        currency: params.currency?.toUpperCase() ?? null,
        isPriorityReservation: !!params.isPriority,
      })
      .returning({ id: reservations.id });

    logActivity({
      restaurantId,
      actor: params.actor,
      type: "reservation.created",
      entityId: reservation.id,
      data: { guestName: name, partySize, date, time },
    });

    return {
      ok: true as const,
      reservationId: reservation.id,
      areaId: availability.area?.id ?? null,
      assignedTables: availability.assignedTables,
      requiresManualSeating: availability.requiresManualSeating,
    };
  });
}
