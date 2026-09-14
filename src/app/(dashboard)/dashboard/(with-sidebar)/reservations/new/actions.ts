"use server";

import { db } from "@/drizzle/db";
import { reservationAreas, reservationTables, restaurant } from "@/drizzle/schema";
import { merchantActor } from "@/lib/activity/log";
import { ensureAuthenticatedUserLean } from "@/lib/auth/guards";
import {
  scheduleReservationReminderEmail,
  sendReservationConfirmationEmail,
} from "@/lib/email/sender-functions/send-reservation-email";
import {
  checkReservationAvailability,
  ReservationAvailabilityResult,
} from "@/lib/services/reservation-availability";
import { createReservationRecord } from "@/lib/services/reservation-create";
import { isPriorityRequest, resolveDepositAmount } from "@/lib/services/reservation-deposit";
import {
  RESERVATIONS_NOT_ON_PLAN_ERROR,
  restaurantHasFeature,
} from "@/lib/services/restaurant-plan";
import { ApiResponse } from "@/lib/types";
import { asc, eq } from "drizzle-orm";
import { reservationRequestSchema } from "@/app/(preview)/r/[slug]/reserve/schema";

export type AdminReservationContext = {
  restaurantName: string;
  currency: string | null;
  areas: { id: string; name: string }[];
  minPartySize: number;
  maxPartySize: number;
  slotDurationMinutes: number;
  requireDeposit: boolean;
  depositAmount: number;
  priorityReservations: boolean;
  priorityReservationAmount: number;
};

export async function getAdminReservationContext(): Promise<ApiResponse<AdminReservationContext>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }
    const { activeRestaurantId } = auth.session.user;

    const record = await db.query.restaurant.findFirst({
      where: eq(restaurant.id, activeRestaurantId),
      columns: { id: true, name: true, stripe: true, reservation_settings: true },
    });
    if (!record) {
      return { success: false, error: "Restaurant not found" };
    }

    const areas = await db.query.reservationAreas.findMany({
      where: (area, { and, eq, exists }) =>
        and(
          eq(area.restaurantId, activeRestaurantId),
          exists(
            db
              .select({ id: reservationTables.id })
              .from(reservationTables)
              .where(eq(reservationTables.areaId, area.id)),
          ),
        ),
      columns: {
        id: true,
        name: true,
      },
      orderBy: [asc(reservationAreas.name)],
    });

    const s = record.reservation_settings;
    return {
      success: true,
      data: {
        restaurantName: record.name,
        currency: record.stripe?.currency ?? null,
        areas,
        minPartySize: s.minPartySize,
        maxPartySize: s.maxPartySize,
        slotDurationMinutes: s.slotDurationMinutes,
        requireDeposit: s.requireDeposit,
        depositAmount: s.depositAmount,
        priorityReservations: s.priorityReservations,
        priorityReservationAmount: s.priorityReservationAmount ?? 0,
      },
    };
  } catch (error) {
    console.error("Failed to load admin reservation context:", error);
    return { success: false, error: "Failed to load reservation settings" };
  }
}

export type AdminAvailabilityInput = {
  date: string;
  time: string;
  partySize: number;
  areaId?: string;
  isPriority?: boolean;
};

export async function checkAdminReservationAvailabilityAction(
  input: AdminAvailabilityInput,
): Promise<ApiResponse<ReservationAvailabilityResult>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }
    const { activeRestaurantId } = auth.session.user;

    if (!(await restaurantHasFeature(activeRestaurantId, "reservations"))) {
      return { success: false, error: RESERVATIONS_NOT_ON_PLAN_ERROR };
    }

    const record = await db.query.restaurant.findFirst({
      where: eq(restaurant.id, activeRestaurantId),
      columns: { id: true, reservation_settings: true, stripe: true },
    });
    if (!record) {
      return { success: false, error: "Restaurant not found" };
    }

    const result = await checkReservationAvailability({
      restaurantId: activeRestaurantId,
      date: input.date,
      time: input.time,
      partySize: input.partySize,
      areaId: input.areaId || null,
      isPriority: isPriorityRequest(record.reservation_settings, input.isPriority),
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to check admin availability:", error);
    return { success: false, error: "Failed to check availability" };
  }
}

export type CreateAdminReservationInput = {
  name: string;
  partySize: number;
  phone: string;
  email: string;
  date: string;
  time: string;
  notes?: string;
  areaId?: string;
  isPriority?: boolean;
};

export type CreateAdminReservationResult = {
  reservationId: string;
  guestName: string;
  date: string;
  time: string;
  partySize: number;
  amount: string;
  paymentStatus: "paid" | "free";
};

export async function createAdminReservationAction(
  input: CreateAdminReservationInput,
): Promise<ApiResponse<CreateAdminReservationResult>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }
    const { activeRestaurantId } = auth.session.user;

    if (!(await restaurantHasFeature(activeRestaurantId, "reservations"))) {
      return { success: false, error: RESERVATIONS_NOT_ON_PLAN_ERROR };
    }

    const parsed = reservationRequestSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const {
      name,
      partySize,
      phone,
      email,
      date,
      time,
      notes,
      areaId,
      isPriority: requestedPriority,
    } = parsed.data;

    const record = await db.query.restaurant.findFirst({
      where: eq(restaurant.id, activeRestaurantId),
      columns: { id: true, reservation_settings: true, stripe: true },
    });
    if (!record) {
      return { success: false, error: "Restaurant not found" };
    }

    const settings = record.reservation_settings;

    const isPriority = isPriorityRequest(settings, requestedPriority);
    const chargeAmount = resolveDepositAmount(settings, isPriority);
    const paymentStatus = chargeAmount > 0 ? "paid" : "free";
    const amount = chargeAmount.toFixed(2);

    const result = await createReservationRecord({
      restaurantId: activeRestaurantId,
      input: { name, partySize, phone, email, date, time, notes, areaId },
      status: "confirmed",
      paymentStatus,
      amount,
      paidAmount: paymentStatus === "paid" ? amount : "0",
      currency: record.stripe?.currency ?? null,
      isPriority,
      actor: merchantActor(auth.session.user),
    });

    if (!result.ok) {
      return { success: false, error: result.error };
    }

    const emailInput = {
      restaurantId: activeRestaurantId,
      guestName: name,
      guestEmail: email,
      partySize,
      date,
      time,
    };
    sendReservationConfirmationEmail(emailInput);
    scheduleReservationReminderEmail(emailInput);

    return {
      success: true,
      data: {
        reservationId: result.reservationId,
        guestName: name,
        date,
        time,
        partySize,
        amount,
        paymentStatus,
      },
    };
  } catch (error) {
    console.error("Failed to create admin reservation:", error);
    return { success: false, error: "Failed to create reservation" };
  }
}
