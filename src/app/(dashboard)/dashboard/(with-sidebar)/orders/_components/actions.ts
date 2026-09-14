"use server";

import { db } from "@/drizzle/db";
import { orders, OrderStatus, PaymentStatus, restaurant } from "@/drizzle/schema";
import { logMerchantActivity } from "@/lib/activity/log";
import { ensureAuthenticatedUserLean } from "@/lib/auth/guards";
import {
  sendDeliveryUpdateEmail,
  sendOrderCancellationEmail,
} from "@/lib/email/sender-functions/send-order-email";
import { refuseOrderTransition } from "@/lib/services/order-status";
import { ApiResponse } from "@/lib/types";
import { RestaurantOrderSettings } from "@/lib/types/order";
import { and, eq, inArray } from "drizzle-orm";

export async function updateRestaurantOrderSettings(
  input: RestaurantOrderSettings,
): Promise<ApiResponse<RestaurantOrderSettings>> {
  const auth = await ensureAuthenticatedUserLean();
  if (!auth.session) {
    return auth.json;
  }

  const [updatedRestaurant] = await db
    .update(restaurant)
    .set({
      orderSettings: input,
    })
    .where(eq(restaurant.id, auth.session.user.activeRestaurantId))
    .returning({
      orderSettings: restaurant.orderSettings,
    });
  logMerchantActivity(auth.session.user, {
    type: "settings.orders_updated",
    data: {},
  });

  return {
    success: true,
    data: updatedRestaurant.orderSettings,
  };
}

const DELIVERY_STATUSES = new Set<OrderStatus>(["delivered"]);

const STATUS_DISPLAY: Record<OrderStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  preparing: "Being prepared",
  ready: "Ready for pickup",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function getStatusDisplay(status: OrderStatus): string {
  return STATUS_DISPLAY[status] ?? status;
}

async function sendDeliveryEmailIfNeeded(
  orderId: string,
  newStatus: OrderStatus,
  restaurantId: string,
): Promise<void> {
  if (!DELIVERY_STATUSES.has(newStatus)) {
    return; // not a delivery-related status
  }

  try {
    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.restaurantId, restaurantId)),
      columns: {
        orderNumber: true,
        name: true,
        email: true,
        restaurantId: true,
      },
    });

    if (!order?.email) {
      console.warn(`No email found for order ${orderId} – skipping delivery update`);
      return;
    }

    let estimatedDelivery: string | undefined;
    if (newStatus === "preparing") {
      estimatedDelivery = "Your order is being prepared";
    } else if (newStatus === "ready") {
      estimatedDelivery = "Your order is ready for pickup";
    } else if (newStatus === "delivered") {
      estimatedDelivery = "Your order has been delivered";
    }

    sendDeliveryUpdateEmail({
      orderNumber: order.orderNumber,
      customerName: order.name,
      customerEmail: order.email,
      restaurantId: order.restaurantId,
      deliveryStatus: getStatusDisplay(newStatus),
      estimatedDelivery,
    });
  } catch (error) {
    console.error(`Failed to send delivery email for order ${orderId}:`, error);
  }
}

async function sendCancellationEmailIfNeeded(
  orderId: string,
  newStatus: OrderStatus,
  restaurantId: string,
): Promise<void> {
  if (newStatus !== "cancelled") {
    return;
  }

  try {
    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.restaurantId, restaurantId)),
      columns: {
        orderNumber: true,
        name: true,
        email: true,
        restaurantId: true,
        total: true,
        currency: true,
      },
    });

    if (!order?.email) {
      console.warn(`No email found for order ${orderId} – skipping cancellation email`);
      return;
    }

    sendOrderCancellationEmail({
      orderNumber: order.orderNumber,
      customerName: order.name,
      customerEmail: order.email,
      restaurantId: order.restaurantId,
      total: Number(order.total),
      currency: order.currency,
    });
  } catch (error) {
    console.error(`Failed to send cancellation email for order ${orderId}:`, error);
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<ApiResponse<{ id: string; status: OrderStatus }>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }
    const { activeRestaurantId } = auth.session.user;

    // Ensure the order belongs to the active restaurant
    const [order] = await db
      .select({
        restaurantId: orders.restaurantId,
        status: orders.status,
        orderNumber: orders.orderNumber,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return { success: false, error: "Order not found" };
    }
    if (order.restaurantId !== activeRestaurantId) {
      return { success: false, error: "Unauthorized" };
    }

    const refusal = refuseOrderTransition(order.status, status);
    if (refusal) {
      return { success: false, error: refusal.message };
    }

    const updated = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning({ id: orders.id, status: orders.status });

    if (!updated.length) {
      return { success: false, error: "Failed to update order" };
    }

    void sendDeliveryEmailIfNeeded(orderId, status, activeRestaurantId);
    void sendCancellationEmailIfNeeded(orderId, status, activeRestaurantId);

    if (order.status !== status) {
      logMerchantActivity(auth.session.user, {
        type: "order.status_changed",
        entityId: orderId,
        data: { orderNumber: order.orderNumber, from: order.status, to: status },
      });
    }

    return { success: true, data: updated[0] };
  } catch (error) {
    console.error("Update order status error:", error);
    return { success: false, error: "Failed to update order status" };
  }
}

export type BulkOrderStatusSkip = {
  id: string;
  orderNumber: number;
  from: OrderStatus;
  clause: string;
};

export type BulkOrderStatusResult = {
  updated: number;
  skipped: BulkOrderStatusSkip[];
};

export async function bulkUpdateOrderStatus(
  orderIds: string[],
  status: OrderStatus,
): Promise<ApiResponse<BulkOrderStatusResult>> {
  try {
    if (!orderIds.length) {
      return { success: false, error: "No orders selected" };
    }

    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }
    const { activeRestaurantId } = auth.session.user;

    // Verify all orders belong to the active restaurant
    const ordersData = await db
      .select({
        id: orders.id,
        restaurantId: orders.restaurantId,
        status: orders.status,
        orderNumber: orders.orderNumber,
      })
      .from(orders)
      .where(inArray(orders.id, orderIds));

    if (ordersData.length !== orderIds.length) {
      return { success: false, error: "Some orders not found" };
    }
    const allBelong = ordersData.every((o) => o.restaurantId === activeRestaurantId);
    if (!allBelong) {
      return { success: false, error: "Unauthorized for some orders" };
    }

    const eligible: string[] = [];
    const skipped: BulkOrderStatusSkip[] = [];

    for (const order of ordersData) {
      const refusal = refuseOrderTransition(order.status, status);
      if (refusal) {
        skipped.push({
          id: order.id,
          orderNumber: order.orderNumber,
          from: order.status,
          clause: refusal.clause,
        });
      } else {
        eligible.push(order.id);
      }
    }

    if (!eligible.length) {
      return { success: true, data: { updated: 0, skipped } };
    }

    const updated = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(inArray(orders.id, eligible))
      .returning({ id: orders.id });

    for (const orderId of updated.map((r) => r.id)) {
      void sendDeliveryEmailIfNeeded(orderId, status, activeRestaurantId);
      void sendCancellationEmailIfNeeded(orderId, status, activeRestaurantId);
    }

    if (updated.length) {
      logMerchantActivity(auth.session.user, {
        type: "order.bulk_status_changed",
        data: { count: updated.length, to: status },
      });
    }

    return { success: true, data: { updated: updated.length, skipped } };
  } catch (error) {
    console.error("Bulk update order status error:", error);
    return { success: false, error: "Failed to update orders" };
  }
}

export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: PaymentStatus,
): Promise<ApiResponse<{ id: string; paymentStatus: PaymentStatus }>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }
    const { activeRestaurantId } = auth.session.user;

    const [order] = await db
      .select({
        restaurantId: orders.restaurantId,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        paymentReference: orders.paymentReference,
        orderNumber: orders.orderNumber,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return { success: false, error: "Order not found" };
    }
    if (order.restaurantId !== activeRestaurantId) {
      return { success: false, error: "Unauthorized" };
    }

    const isCardOrder = !!order.paymentReference?.startsWith("cs_");
    if (isCardOrder) {
      return {
        success: false,
        error: "Card payments are confirmed automatically by Stripe and can't be edited.",
      };
    }
    if (!(order.paymentStatus === "pending" && paymentStatus === "paid")) {
      return { success: false, error: "This payment status can no longer be changed." };
    }

    const shouldAutoConfirm = paymentStatus === "paid" && order.status === "new";

    const updated = await db
      .update(orders)
      .set({
        paymentStatus,
        ...(shouldAutoConfirm ? { status: "confirmed" as OrderStatus } : {}),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning({ id: orders.id, paymentStatus: orders.paymentStatus });

    if (!updated.length) {
      return { success: false, error: "Failed to update payment status" };
    }

    logMerchantActivity(auth.session.user, {
      type: "order.payment_updated",
      entityId: orderId,
      data: { orderNumber: order.orderNumber, paymentStatus },
    });

    return { success: true, data: updated[0] };
  } catch (error) {
    console.error("Update payment status error:", error);
    return { success: false, error: "Failed to update payment status" };
  }
}
