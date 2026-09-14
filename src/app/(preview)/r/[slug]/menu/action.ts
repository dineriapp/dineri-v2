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
import { guestActor, logActivity } from "@/lib/activity/log";
import { limitAnonymousAction } from "@/lib/rate-limit/guard";
import { buildAddonIndex, resolveAddons } from "@/lib/services/order-addons";
import { ORDERING_NOT_ON_PLAN_ERROR, restaurantHasFeature } from "@/lib/services/restaurant-plan";
import { getValidStripeClient } from "@/lib/stripe";
import { decrypt } from "@/lib/stripe/encryption";
import { ApiResponse } from "@/lib/types";
import { and, eq, inArray } from "drizzle-orm";
import { orderSchema, OrderSchemaType } from "./schema";
import { sendOrderBookingEmail } from "@/lib/email/sender-functions/send-order-email";
import { getNextOrderNumber } from "@/lib/server/func/order-number";

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

export async function processOrder(
  input: OrderSchemaType,
): Promise<ApiResponse<processOrderReturnType>> {
  const limit = await limitAnonymousAction("process-order", "publicOrder");
  if (!limit.allowed) {
    return {
      success: false,
      error: "Too many order attempts. Please wait a moment and try again.",
    };
  }

  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const { restaurantId, name, phone, email, location, fulfillment, paymentMethod, cart } =
    parsed.data;
  try {
    // Fetch restaurant info
    const restaurantData = await db
      .select({
        id: restaurant.id,
        orderSettings: restaurant.orderSettings,
        stripe: restaurant.stripe,
        opening_hours: restaurant.opening_hours,
        timezone: restaurant.timezone,
        slug: restaurant.slug,
        is_menu_published: restaurant.is_menu_published,
      })
      .from(restaurant)
      .where(eq(restaurant.id, restaurantId))
      .limit(1);

    if (!restaurantData.length) return { success: false, error: "Restaurant not found" };
    const rest = restaurantData[0];
    const currency = rest.stripe?.currency ?? "usd";
    const orderSettings = rest.orderSettings;

    if (!(await restaurantHasFeature(rest.id, "orderSystem"))) {
      return { success: false, error: ORDERING_NOT_ON_PLAN_ERROR };
    }

    if (!rest.is_menu_published) {
      return { success: false, error: "This restaurant is not accepting online orders right now." };
    }

    if (orderSettings.status === "closed") {
      return { success: false, error: "Restaurant is not accepting orders." };
    }
    if (orderSettings.status === "no-delivery" && fulfillment === "delivery") {
      return { success: false, error: "Delivery is not available." };
    }
    if (orderSettings.status === "no-pickup" && fulfillment === "pickup") {
      return { success: false, error: "Pickup is not available." };
    }

    // Validate all menu items exist and belong to the restaurant
    const uniqueMenuItemIds = [...new Set(cart.map((item) => item.id))];
    const menuItemsData = await db
      .select({
        id: menuItems.id,
        name: menuItems.name,
        price: menuItems.price,
        addons: menuItems.addons,
      })
      .from(menuItems)
      .innerJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
      .where(
        and(
          eq(menuCategories.restaurantId, restaurantId),
          inArray(menuItems.id, uniqueMenuItemIds),
          eq(menuCategories.show_on_public_page, true),
          eq(menuItems.show_on_public_page, true),
        ),
      );

    if (menuItemsData.length !== uniqueMenuItemIds.length) {
      return { success: false, error: "One or more menu items are invalid" };
    }

    const itemMap = new Map(
      menuItemsData.map((item) => [
        item.id,
        {
          name: item.name,
          price: Number(item.price),
          addons: buildAddonIndex(item.addons),
        },
      ]),
    );

    // Calculate totals
    let subtotal = 0;
    const orderItemsData: orderItemsDataType[] = [];
    const checkoutLineItems = [];

    for (const cartItem of cart) {
      const menuItem = itemMap.get(cartItem.id);
      if (!menuItem) throw new Error(`Menu item ${cartItem.id} not found`);

      const basePrice = menuItem.price;

      const resolution = resolveAddons(cartItem.addons, menuItem.addons, menuItem.name);
      if (!resolution.ok) {
        return { success: false, error: resolution.error };
      }
      const resolvedAddons = resolution.addons;

      const unitPrice = basePrice + resolution.total;
      const lineTotal = unitPrice * cartItem.quantity;
      subtotal += lineTotal;

      // Store order item
      orderItemsData.push({
        menuItemId: cartItem.id,
        itemName: menuItem.name,
        itemPrice: basePrice,
        quantity: cartItem.quantity,
        addons: resolvedAddons,
        lineTotal,
        customization: cartItem.customization || null,
      });

      // Add to Stripe Checkout line items
      checkoutLineItems.push({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: menuItem.name,
            description: resolvedAddons.length
              ? `Add-ons: ${resolvedAddons.map((a) => a.label).join(", ")}`
              : undefined,
          },
          unit_amount: Math.round(unitPrice * 100),
        },
        quantity: cartItem.quantity,
      });
    }

    const deliveryFee = fulfillment === "delivery" ? Number(orderSettings.deliveryFee) : 0;
    const taxRate = Number(orderSettings.taxRate);
    const tax = (subtotal * taxRate) / 100;
    const total = subtotal + deliveryFee + tax;

    // Add delivery fee and tax
    if (deliveryFee > 0) {
      checkoutLineItems.push({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: { name: "Delivery fee" },
          unit_amount: Math.round(deliveryFee * 100),
        },
        quantity: 1,
      });
    }
    if (tax > 0) {
      checkoutLineItems.push({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: { name: `Tax (${taxRate}%)` },
          unit_amount: Math.round(tax * 100),
        },
        quantity: 1,
      });
    }

    // Generate order number
    const nextOrderNumber = await getNextOrderNumber(restaurantId);

    // Handle payment
    let paymentStatus: PaymentStatus = "pending";
    let paymentReference: string | null = null;
    let redirectUrl: string | null = null;

    if (paymentMethod === "card") {
      // Card
      if (!rest.stripe?.configured)
        return { success: false, error: "Card payments are not configured for this restaurant." };
      const secretKey = decrypt(rest?.stripe?.secret ?? "");
      const stripe = await getValidStripeClient(secretKey);
      if (!stripe) return { success: false, error: "Invalid Stripe configuration." };
      const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
      try {
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          payment_method_types: ["card"],
          line_items: checkoutLineItems,
          metadata: {
            restaurantId,
            orderNumber: String(nextOrderNumber),
            email,
            fulfillment,
          },
          success_url: `${baseUrl}/r/${rest.slug}/menu/order/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/r/${rest.slug}/menu`,
          customer_email: email,
          client_reference_id: restaurantId,
        });
        redirectUrl = session.url;
        paymentReference = session.id;
        paymentStatus = "pending";
      } catch (stripeError) {
        console.error("Stripe Checkout error:", stripeError);
        return { success: false, error: "Failed to create payment session. Please try again." };
      }
    } else {
      // Cash
      paymentStatus = "pending";
      paymentReference = null;
    }

    // Insert order
    const result = await db.transaction(async (tx) => {
      const orderInsert: typeof orders.$inferInsert = {
        restaurantId: rest.id,
        name: name,
        phone: phone,
        email: email,
        location: location,
        fulfillment: fulfillment as Fulfillment,
        orderNumber: nextOrderNumber,
        status: "new" as OrderStatus,
        paymentStatus,
        subtotal: String(subtotal),
        total: String(total),
        currency,
        paymentReference: paymentReference || null,
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

    logActivity({
      restaurantId,
      actor: guestActor(name),
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
        url: redirectUrl,
      },
    };
  } catch (error) {
    console.error("Order processing error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process order",
    };
  }
}
