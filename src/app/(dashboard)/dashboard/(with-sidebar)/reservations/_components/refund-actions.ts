"use server";

import { db } from "@/drizzle/db";
import { reservations } from "@/drizzle/schema";
import { logMerchantActivity } from "@/lib/activity/log";
import { ensureAuthenticatedUserLean } from "@/lib/auth/guards";
import { sendReservationRefundEmail } from "@/lib/email/sender-functions/send-reservation-email";
import {
  centsToNumeric,
  checkRefundAmount,
  REFUND_ERRORS,
  refundableCents,
} from "@/lib/reservations/refunds";
import { getValidStripeClient } from "@/lib/stripe";
import { decrypt } from "@/lib/stripe/encryption";
import { fmtMoney } from "@/lib/stripe/types";
import { ApiResponse } from "@/lib/types";
import { and, eq, sql } from "drizzle-orm";

export type RefundReservationInput = {
  reservationId: string;
  amount: number;
  reason?: string;
};

export type RefundReservationResult = {
  id: string;
  refundedAmount: string;
  refundReference: string;
};

export async function refundReservationAction(
  input: RefundReservationInput,
): Promise<ApiResponse<RefundReservationResult>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }
    const { activeRestaurantId } = auth.session.user;

    const existing = await db.query.reservations.findFirst({
      where: and(
        eq(reservations.id, input.reservationId),
        eq(reservations.restaurantId, activeRestaurantId),
      ),
      columns: {
        id: true,
        guestName: true,
        guestEmail: true,
        partySize: true,
        date: true,
        time: true,
        currency: true,
        paymentStatus: true,
        paymentReference: true,
        paymentIntentId: true,
        paidAmount: true,
        refundedAmount: true,
      },
    });

    if (!existing) {
      return { success: false, error: "Reservation not found" };
    }

    const check = checkRefundAmount(input.amount, existing.paidAmount, existing.refundedAmount);
    if (!check.ok) {
      return { success: false, error: check.error };
    }

    const restaurantRecord = await db.query.restaurant.findFirst({
      where: (r, { eq: is }) => is(r.id, activeRestaurantId),
      columns: { stripe: true },
    });

    if (!restaurantRecord?.stripe?.configured) {
      return { success: false, error: "Connect Stripe before issuing refunds." };
    }

    const stripe = await getValidStripeClient(decrypt(restaurantRecord.stripe.secret ?? ""));
    if (!stripe) {
      return { success: false, error: "Stripe credentials are no longer valid." };
    }

    let paymentIntentId = existing.paymentIntentId;
    if (!paymentIntentId && existing.paymentReference) {
      const session = await stripe.checkout.sessions.retrieve(existing.paymentReference);
      paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null);
    }

    if (!paymentIntentId) {
      return { success: false, error: REFUND_ERRORS.noPaymentIntent };
    }

    const refund = await stripe.refunds.create(
      {
        payment_intent: paymentIntentId,
        amount: check.cents,
        metadata: {
          type: "reservation_refund",
          restaurantId: activeRestaurantId,
          reservationId: existing.id,
          ...(input.reason?.trim() ? { reason: input.reason.trim().slice(0, 500) } : {}),
        },
      },
      {
        idempotencyKey: `res_refund_${existing.id}_${existing.refundedAmount}_${check.cents}`,
      },
    );

    const [updated] = await db
      .update(reservations)
      .set({
        refundedAmount: sql`${reservations.refundedAmount} + ${centsToNumeric(check.cents)}`,
        refundedAt: new Date(),
        refundReference: refund.id,
        refundReason: input.reason?.trim() || null,
        paymentIntentId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(reservations.id, existing.id),
          eq(reservations.restaurantId, activeRestaurantId),
          eq(reservations.refundedAmount, existing.refundedAmount),
        ),
      )
      .returning({ refundedAmount: reservations.refundedAmount });

    if (!updated) {
      console.error("Refund recorded in Stripe but row changed concurrently", {
        reservationId: existing.id,
        refundId: refund.id,
      });
      return {
        success: false,
        error: "This booking was updated elsewhere. Reload to see its current refund total.",
      };
    }

    const money = fmtMoney(check.cents / 100, existing.currency);

    logMerchantActivity(auth.session.user, {
      type: "reservation.refunded",
      entityId: existing.id,
      data: {
        guestName: existing.guestName,
        amount: money,
        partial: check.state === "partial",
        reason: input.reason?.trim() || null,
      },
    });

    sendReservationRefundEmail({
      restaurantId: activeRestaurantId,
      guestName: existing.guestName,
      guestEmail: existing.guestEmail,
      partySize: existing.partySize,
      date: existing.date,
      time: existing.time,
      refundAmount: money,
    });

    return {
      success: true,
      data: {
        id: existing.id,
        refundedAmount: updated.refundedAmount,
        refundReference: refund.id,
      },
    };
  } catch (error) {
    console.error("Failed to refund reservation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to issue refund",
    };
  }
}

export async function getRefundableAmountAction(
  reservationId: string,
): Promise<ApiResponse<{ refundable: number }>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }

    const row = await db.query.reservations.findFirst({
      where: and(
        eq(reservations.id, reservationId),
        eq(reservations.restaurantId, auth.session.user.activeRestaurantId),
      ),
      columns: { paidAmount: true, refundedAmount: true },
    });

    if (!row) {
      return { success: false, error: "Reservation not found" };
    }

    return {
      success: true,
      data: { refundable: refundableCents(row.paidAmount, row.refundedAmount) / 100 },
    };
  } catch (error) {
    console.error("Failed to read refundable amount:", error);
    return { success: false, error: "Failed to read refundable amount" };
  }
}
