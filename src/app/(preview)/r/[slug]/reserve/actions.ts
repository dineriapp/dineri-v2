"use server";

import { db } from "@/drizzle/db";
import { reservations, restaurant } from "@/drizzle/schema";
import {
  scheduleReservationReminderEmail,
  sendReservationConfirmationEmail,
} from "@/lib/email/sender-functions/send-reservation-email";
import { getValidStripeClient } from "@/lib/stripe";
import { decrypt } from "@/lib/stripe/encryption";
import {
  checkReservationAvailability,
  ReservationAvailabilityResult,
} from "@/lib/services/reservation-availability";
import { guestActor } from "@/lib/activity/log";
import { limitAnonymousAction } from "@/lib/rate-limit/guard";
import { createReservationRecord } from "@/lib/services/reservation-create";
import { isPriorityRequest, resolveDepositAmount } from "@/lib/services/reservation-deposit";
import { checkoutExpiresAt } from "@/lib/services/reservation-hold";
import {
  reservationSuccessPath,
  reservationSuccessUrl,
} from "@/lib/services/reservation-success-token";
import { venueUrl } from "@/lib/venue-url";
import { getOnlineReservationsStatus } from "@/lib/services/reservation-online-availability";
import {
  RESERVATIONS_NOT_ON_PLAN_ERROR,
  restaurantHasFeature,
} from "@/lib/services/restaurant-plan";
import { ApiResponse } from "@/lib/types";
import { and, eq } from "drizzle-orm";
import { reservationRequestSchema } from "./schema";

export type CheckReservationAvailabilityInput = {
  slug: string;
  date: string;
  time: string;
  partySize: number;
  areaId?: string;
  isPriority?: boolean;
};

export async function checkReservationAvailabilityAction(
  input: CheckReservationAvailabilityInput,
): Promise<ApiResponse<ReservationAvailabilityResult>> {
  const limit = await limitAnonymousAction("check-reservation-availability", "publicAvailability");
  if (!limit.allowed) {
    return {
      success: false,
      error: "Too many availability checks. Please wait a moment and try again.",
    };
  }

  const restaurantRecord = await db.query.restaurant.findFirst({
    where: eq(restaurant.slug, input.slug),
    columns: { id: true, reservation_settings: true },
  });

  if (!restaurantRecord) {
    return { success: false, error: "Restaurant not found" };
  }

  if (!(await restaurantHasFeature(restaurantRecord.id, "reservations"))) {
    return { success: false, error: RESERVATIONS_NOT_ON_PLAN_ERROR };
  }

  const onlineStatus = getOnlineReservationsStatus(restaurantRecord.reservation_settings);
  if (!onlineStatus.available) {
    return { success: false, error: onlineStatus.message };
  }

  const result = await checkReservationAvailability({
    restaurantId: restaurantRecord.id,
    date: input.date,
    time: input.time,
    partySize: input.partySize,
    areaId: input.areaId || null,
    isPriority: isPriorityRequest(restaurantRecord.reservation_settings, input.isPriority),
  });

  return { success: true, data: result };
}

export type CreateReservationInput = {
  slug: string;
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

export type CreateReservationResult =
  | { status: "confirmed"; reservationId: string; checkoutUrl: null; successPath: string }
  | { status: "awaiting_payment"; reservationId: string; checkoutUrl: string };

const STRIPE_NOT_CONFIGURED_ERROR =
  "Online reservation payments are currently unavailable because this restaurant has not completed Stripe setup.";

export async function createReservationAction(
  input: CreateReservationInput,
): Promise<ApiResponse<CreateReservationResult>> {
  const limit = await limitAnonymousAction("create-reservation", "publicReservation");
  if (!limit.allowed) {
    return {
      success: false,
      error: "Too many reservation attempts. Please wait a moment and try again.",
    };
  }

  const parsed = reservationRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  if (!input.slug) {
    return { success: false, error: "Restaurant not found" };
  }

  const { name, partySize, phone, email, date, time, notes, areaId } = parsed.data;

  try {
    const restaurantRecord = await db.query.restaurant.findFirst({
      where: eq(restaurant.slug, input.slug),
      columns: {
        id: true,
        name: true,
        stripe: true,
        reservation_settings: true,
      },
    });

    if (!restaurantRecord) {
      return { success: false, error: "Restaurant not found" };
    }

    const restaurantId = restaurantRecord.id;
    const settings = restaurantRecord.reservation_settings;

    if (!(await restaurantHasFeature(restaurantId, "reservations"))) {
      return { success: false, error: RESERVATIONS_NOT_ON_PLAN_ERROR };
    }

    const onlineStatus = getOnlineReservationsStatus(settings);
    if (!onlineStatus.available) {
      return { success: false, error: onlineStatus.message };
    }

    const isPriority = isPriorityRequest(settings, input.isPriority);
    const chargeAmount = resolveDepositAmount(settings, isPriority);
    const requiresDeposit = chargeAmount > 0;

    let stripeClient: Awaited<ReturnType<typeof getValidStripeClient>> | null = null;
    if (requiresDeposit) {
      if (!restaurantRecord.stripe?.configured) {
        return { success: false, error: STRIPE_NOT_CONFIGURED_ERROR };
      }
      const secretKey = decrypt(restaurantRecord.stripe.secret ?? "");
      const validated = await getValidStripeClient(secretKey);
      if (!validated) {
        return { success: false, error: STRIPE_NOT_CONFIGURED_ERROR };
      }
      stripeClient = validated;
    }

    const insertResult = await createReservationRecord({
      restaurantId,
      input: { name, partySize, phone, email, date, time, notes, areaId },
      status: settings.autoConfirm ? "confirmed" : "pending",
      paymentStatus: requiresDeposit ? "pending" : "free",
      amount: chargeAmount.toFixed(2),
      currency: restaurantRecord.stripe?.currency ?? null,
      isPriority,
      actor: guestActor(name),
    });

    if (!insertResult.ok) {
      return { success: false, error: insertResult.error };
    }

    const { reservationId } = insertResult;

    if (!requiresDeposit) {
      if (settings.autoConfirm) {
        const emailInput = {
          restaurantId,
          guestName: name,
          guestEmail: email,
          partySize,
          date,
          time,
        };
        sendReservationConfirmationEmail(emailInput);
        scheduleReservationReminderEmail(emailInput);
      }

      return {
        success: true,
        data: {
          status: "confirmed",
          reservationId,
          checkoutUrl: null,
          successPath: reservationSuccessPath(input.slug, reservationId),
        },
      };
    }

    try {
      const currency = restaurantRecord.stripe?.currency ?? "usd";

      const session = await stripeClient!.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: `${isPriority ? "Priority reservation" : "Reservation"} charge - ${restaurantRecord.name}`,
                description: `${date} at ${time} - ${partySize} guest${partySize === 1 ? "" : "s"}`,
              },
              unit_amount: Math.round(chargeAmount * 100),
            },
            quantity: 1,
          },
        ],
        metadata: {
          type: "reservation_deposit",
          restaurantId,
          reservationId,
        },
        // Absolute and on the venue host: the guest is returning from Stripe.
        success_url: reservationSuccessUrl(input.slug, reservationId),
        cancel_url: venueUrl(input.slug, "/reserve"),
        customer_email: email,
        client_reference_id: restaurantId,
        expires_at: checkoutExpiresAt(settings),
      });

      if (!session.url) {
        throw new Error("Stripe did not return a checkout URL");
      }

      await db
        .update(reservations)
        .set({ paymentReference: session.id })
        .where(eq(reservations.id, reservationId));

      return {
        success: true,
        data: { status: "awaiting_payment", reservationId, checkoutUrl: session.url },
      };
    } catch (stripeError) {
      console.error("Reservation deposit checkout error:", stripeError);

      await db
        .update(reservations)
        .set({ status: "cancelled", paymentStatus: "failed", updatedAt: new Date() })
        .where(and(eq(reservations.id, reservationId), eq(reservations.paymentStatus, "pending")));

      return { success: false, error: "Failed to create payment session. Please try again." };
    }
  } catch (error) {
    console.error("Reservation creation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create reservation",
    };
  }
}
