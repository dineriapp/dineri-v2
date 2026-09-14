"use server";

import { db } from "@/drizzle/db";
import {
  Fulfillment,
  menuCategories,
  menuItems,
  orderItems,
  orders,
  OrderStatus,
  PaymentStatus,
  restaurant,
} from "@/drizzle/schema";
import { ApiResponse } from "@/lib/types";
import { and, eq, inArray } from "drizzle-orm";
import { orderSchema, OrderSchemaType } from "@/app/(preview)/r/[slug]/menu/schema"; // adjust path if needed
import { logMerchantActivity } from "@/lib/activity/log";
import { ensureAuthenticatedUserLean } from "@/lib/auth/guards";
import { sendOrderBookingEmail } from "@/lib/email/sender-functions/send-order-email";
import { getNextOrderNumber } from "@/lib/server/func/order-number";
import { ORDERING_NOT_ON_PLAN_ERROR, restaurantHasFeature } from "@/lib/services/restaurant-plan";

type orderItemsDataType = {
  menuItemId: string;
  itemName: string;
  itemPrice: number;
  quantity: number;
  addons: {
    label: string;
    price: number;
  }[];
  lineTotal: number;
  customization: string | null;
};

type processOrderReturnType = {
  url: string | null;
};

export async function processOrderAdmin(
  input: OrderSchemaType,
): Promise<ApiResponse<processOrderReturnType>> {
  const auth = await ensureAuthenticatedUserLean();
  if (!auth.session) {
    return { success: false, error: "401" };
  }

  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const { activeRestaurantId: restaurantId } = auth.session.user;
  const { name, phone, email, location, fulfillment, paymentMethod, cart } = parsed.data;

  if (!(await restaurantHasFeature(restaurantId, "orderSystem"))) {
    return { success: false, error: ORDERING_NOT_ON_PLAN_ERROR };
  }

  try {
    const restaurantData = await db
      .select({
        id: restaurant.id,
        orderSettings: restaurant.orderSettings,
        stripe: restaurant.stripe,
        opening_hours: restaurant.opening_hours,
        timezone: restaurant.timezone,
        slug: restaurant.slug,
      })
      .from(restaurant)
      .where(eq(restaurant.id, restaurantId))
      .limit(1);

    if (!restaurantData.length) {
      return { success: false, error: "Restaurant not found" };
    }
    const rest = restaurantData[0];
    const currency = rest.stripe?.currency ?? "usd";
    const orderSettings = rest.orderSettings;

    // Validate menu items
    const uniqueMenuItemIds = [...new Set(cart.map((item) => item.id))];
    const menuItemsData = await db
      .select({
        id: menuItems.id,
        name: menuItems.name,
        price: menuItems.price,
      })
      .from(menuItems)
      .innerJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
      .where(
        and(
          eq(menuCategories.restaurantId, restaurantId),
          inArray(menuItems.id, uniqueMenuItemIds),
        ),
      );

    if (menuItemsData.length !== uniqueMenuItemIds.length) {
      return { success: false, error: "One or more menu items are invalid" };
    }

    const itemMap = new Map(
      menuItemsData.map((item) => [item.id, { name: item.name, price: Number(item.price) }]),
    );

    // Calculate totals
    let subtotal = 0;
    const orderItemsData: orderItemsDataType[] = [];

    for (const cartItem of cart) {
      const menuItem = itemMap.get(cartItem.id);
      if (!menuItem) throw new Error(`Menu item ${cartItem.id} not found`);

      const basePrice = menuItem.price;
      const addonTotal = cartItem.addons.reduce((sum, a) => sum + a.price, 0);
      const unitPrice = basePrice + addonTotal;
      const lineTotal = unitPrice * cartItem.quantity;
      subtotal += lineTotal;

      orderItemsData.push({
        menuItemId: cartItem.id,
        itemName: menuItem.name,
        itemPrice: basePrice,
        quantity: cartItem.quantity,
        addons: cartItem.addons,
        lineTotal,
        customization: cartItem.customization || null,
      });
    }

    const deliveryFee = fulfillment === "delivery" ? Number(orderSettings.deliveryFee) : 0;
    const taxRate = Number(orderSettings.taxRate);
    const tax = (subtotal * taxRate) / 100;
    const total = subtotal + deliveryFee + tax;

    // Generate order number
    const nextOrderNumber = await getNextOrderNumber(restaurantId);

    const paymentStatus: PaymentStatus = "paid";
    const paymentReference: string | null =
      paymentMethod === "card"
        ? `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        : null;

    // Insert order
    const result = await db.transaction(async (tx) => {
      const orderInsert: typeof orders.$inferInsert = {
        restaurantId: rest.id,
        name,
        phone,
        email,
        location,
        fulfillment: fulfillment as Fulfillment,
        orderNumber: nextOrderNumber,
        status: paymentStatus === "paid" ? "confirmed" : ("new" as OrderStatus),
        paymentStatus,
        subtotal: String(subtotal),
        total: String(total),
        currency,
        paymentReference,
      };

      const [order] = await tx
        .insert(orders)
        .values(orderInsert)
        .returning({ id: orders.id, orderNumber: orders.orderNumber });

      if (order && orderItemsData.length) {
        await tx.insert(orderItems).values(
          orderItemsData.map((item) => ({
            orderId: order.id,
            menuItemId: item.menuItemId,
            itemName: item.itemName,
            itemPrice: String(item.itemPrice),
            quantity: item.quantity,
            addons: item.addons,
            lineTotal: String(item.lineTotal),
            customization: item.customization,
          })),
        );
      }

      return order;
    });

    sendOrderBookingEmail({
      orderNumber: result.orderNumber,
      customerName: name,
      customerEmail: email,
      total,
      currency,
      restaurantId,
    });
    logMerchantActivity(auth.session.user, {
      type: "order.created",
      entityId: result.id,
      data: {
        orderNumber: result.orderNumber,
        customerName: name,
        total: String(total),
        currency,
        fulfillment,
      },
    });

    return {
      success: true,
      data: {
        url: null,
      },
    };
  } catch (error) {
    console.error("Admin order processing error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process order",
    };
  }
}
