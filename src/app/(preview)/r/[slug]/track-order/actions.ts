"use server";

import { db } from "@/drizzle/db";
import { orders, restaurant } from "@/drizzle/schema";
import { limitAnonymousAction } from "@/lib/rate-limit/guard";
import { ApiResponse } from "@/lib/types";
import { and, eq, sql } from "drizzle-orm";
import { orderTrackingSchema } from "./schema";

export type TrackOrderInput = {
  slug: string;
  orderNumber: string;
  email: string;
};

const NOT_FOUND_ERROR =
  "We couldn't find an order with that number and email for this restaurant. Double-check both and try again.";

export async function trackOrderAction(
  input: TrackOrderInput,
): Promise<ApiResponse<{ orderId: string }>> {
  const limit = await limitAnonymousAction("track-order", "orderTracking");
  if (!limit.allowed) {
    return { success: false, error: "Too many attempts. Please wait a moment and try again." };
  }

  const parsed = orderTrackingSchema.safeParse({
    orderNumber: input.orderNumber,
    email: input.email,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const restaurantRecord = await db.query.restaurant.findFirst({
      where: eq(restaurant.slug, input.slug),
      columns: { id: true },
    });
    if (!restaurantRecord) {
      return { success: false, error: "Restaurant not found" };
    }

    const order = await db.query.orders.findFirst({
      where: and(
        eq(orders.restaurantId, restaurantRecord.id),
        eq(orders.orderNumber, parsed.data.orderNumber),
        eq(sql`lower(${orders.email})`, parsed.data.email),
      ),
      columns: { id: true },
    });

    if (!order) {
      return { success: false, error: NOT_FOUND_ERROR };
    }

    return { success: true, data: { orderId: order.id } };
  } catch (error) {
    console.error("Order tracking lookup failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
