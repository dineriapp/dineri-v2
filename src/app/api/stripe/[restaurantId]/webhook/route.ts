import { db } from "@/drizzle/db";
import { orders, reservations, restaurant } from "@/drizzle/schema";
import { sendOrderPaymentReceivedEmail } from "@/lib/email/sender-functions/send-order-email";
import {
  scheduleReservationReminderEmail,
  sendReservationConfirmationEmail,
} from "@/lib/email/sender-functions/send-reservation-email";
import { limitApi } from "@/lib/rate-limit/guard";
import { RATE_LIMIT_MESSAGE, rateLimitHeaders } from "@/lib/rate-limit/http";
import { getValidStripeClient } from "@/lib/stripe";
import { decrypt } from "@/lib/stripe/encryption";
import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> },
) {
  const limit = await limitApi("stripe-webhook", "stripeWebhook", req.headers);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: RATE_LIMIT_MESSAGE },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  const { restaurantId } = await params;

  const rawBody = await req.text();

  const restaurantData = await db
    .select({
      stripe: restaurant.stripe,
    })
    .from(restaurant)
    .where(eq(restaurant.id, restaurantId))
    .limit(1);

  if (!restaurantData.length) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const { stripe } = restaurantData[0];
  if (!stripe?.configured) {
    console.error("Webhook secret not configured for restaurant", restaurantId);
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    if (!stripe?.webhook_secret) {
      console.error("Webhook secret missing for restaurant", restaurantId);
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }
    const webhookSecret = decrypt(stripe.webhook_secret);
    event = Stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session?.metadata?.type === "reservation_deposit") {
          return handleReservationPaymentSucceeded(session, restaurantId);
        }

        if (!session?.metadata?.orderNumber || !session?.metadata?.restaurantId) {
          console.error("Missing metadata in session:", session.id);
          return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
        }

        if (session?.metadata?.restaurantId !== restaurantId) {
          console.error("Restaurant ID mismatch", {
            meta: session.metadata.restaurantId,
            url: restaurantId,
          });
          return NextResponse.json({ error: "Restaurant ID mismatch" }, { status: 400 });
        }

        const orderNumberInt = parseInt(session?.metadata?.orderNumber, 10);

        const updated = await db
          .update(orders)
          .set({
            paymentStatus: "paid",
            status: sql`case when ${orders.status} = 'new'
                                         then 'confirmed' else ${orders.status} end`,
          })
          .where(
            and(
              eq(orders.restaurantId, restaurantId),
              eq(orders.orderNumber, orderNumberInt),
              eq(orders.paymentStatus, "pending"),
            ),
          )
          .returning({ id: orders.id });

        if (updated.length === 0) {
          const existing = await db.query.orders.findFirst({
            where: and(
              eq(orders.restaurantId, restaurantId),
              eq(orders.orderNumber, orderNumberInt),
            ),
            columns: { id: true },
          });

          if (!existing) {
            console.error("Order not found for update", {
              restaurantId,
              orderNumber: session?.metadata?.orderNumber,
            });
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
          }

          console.log(
            `Order #${session?.metadata?.orderNumber} already processed - skipping duplicate webhook`,
          );
          return NextResponse.json({ received: true });
        }

        console.log(`Order #${session?.metadata?.orderNumber} payment status updated to paid`);

        const orderRecord = await db.query.orders.findFirst({
          where: and(eq(orders.restaurantId, restaurantId), eq(orders.orderNumber, orderNumberInt)),
          columns: {
            orderNumber: true,
            name: true,
            email: true,
            total: true,
            currency: true,
          },
        });

        if (orderRecord) {
          sendOrderPaymentReceivedEmail({
            orderNumber: orderRecord.orderNumber,
            customerName: orderRecord.name,
            customerEmail: orderRecord.email,
            total: parseFloat(orderRecord.total),
            currency: orderRecord.currency,
            restaurantId,
            paymentMethod: "Card",
          });
        }

        break;
      }

      case "charge.refunded":
      case "charge.refund.updated": {
        return handleRefundSynced(event, restaurantId);
      }

      case "charge.dispute.created": {
        return handleDisputeOpened(event.data.object as Stripe.Dispute, restaurantId);
      }

      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session?.metadata?.type === "reservation_deposit") {
          return handleReservationPaymentFailed(session, restaurantId);
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

async function handleReservationPaymentSucceeded(
  session: Stripe.Checkout.Session,
  restaurantId: string,
): Promise<NextResponse> {
  const reservationId = session.metadata?.reservationId;

  if (!reservationId || !session.metadata?.restaurantId) {
    console.error("Missing metadata in reservation session:", session.id);
    return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
  }

  if (session.metadata.restaurantId !== restaurantId) {
    console.error("Restaurant ID mismatch (reservation)", {
      meta: session.metadata.restaurantId,
      url: restaurantId,
    });
    return NextResponse.json({ error: "Restaurant ID mismatch" }, { status: 400 });
  }

  const amountPaid = (session.amount_total ?? 0) / 100;
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  const updated = await db
    .update(reservations)
    .set({
      paymentStatus: "paid",
      status: "confirmed",
      amount: amountPaid.toFixed(2),
      paidAmount: amountPaid.toFixed(2),
      paymentIntentId,
      currency: session.currency?.toUpperCase() ?? null,
    })
    .where(
      and(
        eq(reservations.id, reservationId),
        eq(reservations.restaurantId, restaurantId),
        eq(reservations.paymentStatus, "pending"),
      ),
    )
    .returning({
      id: reservations.id,
      guestName: reservations.guestName,
      guestEmail: reservations.guestEmail,
      partySize: reservations.partySize,
      date: reservations.date,
      time: reservations.time,
    });

  if (updated.length === 0) {
    const existing = await db.query.reservations.findFirst({
      where: and(eq(reservations.id, reservationId), eq(reservations.restaurantId, restaurantId)),
      columns: { id: true },
    });

    if (!existing) {
      console.error("Reservation not found for update", { restaurantId, reservationId });
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    console.log(`Reservation ${reservationId} already processed - skipping duplicate webhook`);
    return NextResponse.json({ received: true });
  }

  const booking = updated[0];
  const emailInput = {
    restaurantId,
    guestName: booking.guestName,
    guestEmail: booking.guestEmail,
    partySize: booking.partySize,
    date: booking.date,
    time: booking.time,
  };
  sendReservationConfirmationEmail(emailInput);
  scheduleReservationReminderEmail(emailInput);

  console.log(`Reservation ${reservationId} payment status updated to paid`);
  return NextResponse.json({ received: true });
}

async function handleReservationPaymentFailed(
  session: Stripe.Checkout.Session,
  restaurantId: string,
): Promise<NextResponse> {
  const reservationId = session.metadata?.reservationId;

  if (!reservationId || session.metadata?.restaurantId !== restaurantId) {
    console.error(
      "Missing or mismatched metadata in expired/failed reservation session:",
      session.id,
    );
    return NextResponse.json({ received: true });
  }

  await db
    .update(reservations)
    .set({ status: "cancelled", paymentStatus: "failed" })
    .where(
      and(
        eq(reservations.id, reservationId),
        eq(reservations.restaurantId, restaurantId),
        eq(reservations.paymentStatus, "pending"),
      ),
    );

  console.log(`Reservation ${reservationId} payment marked failed (session ${session.id})`);
  return NextResponse.json({ received: true });
}

async function handleRefundSynced(
  event: Stripe.Event,
  restaurantId: string,
): Promise<NextResponse> {
  const object = event.data.object as Stripe.Charge | Stripe.Refund;

  const charge =
    object.object === "charge"
      ? (object as Stripe.Charge)
      : await (async () => {
          const refund = object as Stripe.Refund;
          const chargeId = typeof refund.charge === "string" ? refund.charge : refund.charge?.id;
          if (!chargeId) return null;
          const client = await stripeClientFor(restaurantId);
          return client ? await client.charges.retrieve(chargeId) : null;
        })();

  if (!charge) {
    console.error("Refund webhook without a resolvable charge", event.id);
    return NextResponse.json({ received: true });
  }

  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : (charge.payment_intent?.id ?? null);

  if (!paymentIntentId) {
    console.error("Refunded charge has no payment intent", charge.id);
    return NextResponse.json({ received: true });
  }

  const refundedTotal = (charge.amount_refunded ?? 0) / 100;

  const updated = await db
    .update(reservations)
    .set({
      refundedAmount: refundedTotal.toFixed(2),
      refundedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(reservations.restaurantId, restaurantId),
        eq(reservations.paymentIntentId, paymentIntentId),
      ),
    )
    .returning({ id: reservations.id });

  if (updated.length === 0) {
    return NextResponse.json({ received: true });
  }

  console.log(`Reservation ${updated[0].id} refund total synced to ${refundedTotal}`);
  return NextResponse.json({ received: true });
}

async function handleDisputeOpened(
  dispute: Stripe.Dispute,
  restaurantId: string,
): Promise<NextResponse> {
  const paymentIntentId =
    typeof dispute.payment_intent === "string"
      ? dispute.payment_intent
      : (dispute.payment_intent?.id ?? null);

  if (!paymentIntentId) {
    return NextResponse.json({ received: true });
  }

  const updated = await db
    .update(reservations)
    .set({
      refundReason: sql`coalesce(${reservations.refundReason}, ${`Disputed by cardholder (${dispute.reason})`})`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(reservations.restaurantId, restaurantId),
        eq(reservations.paymentIntentId, paymentIntentId),
      ),
    )
    .returning({ id: reservations.id });

  if (updated.length > 0) {
    console.warn(`Reservation ${updated[0].id} has an open dispute (${dispute.reason})`);
  }

  return NextResponse.json({ received: true });
}

async function stripeClientFor(restaurantId: string) {
  const record = await db.query.restaurant.findFirst({
    where: eq(restaurant.id, restaurantId),
    columns: { stripe: true },
  });

  if (!record?.stripe?.configured || !record.stripe.secret) return null;
  const client = await getValidStripeClient(decrypt(record.stripe.secret));
  return client || null;
}
