import { TemplateDataMap } from "./types";

export function getTestDataForTemplate<K extends keyof TemplateDataMap>(
  key: K,
  businessName: string,
): TemplateDataMap[K] {
  const templates: TemplateDataMap = {
    reservation_confirmation: {
      customer_name: "Jane Doe",
      restaurant_name: businessName,
      reservation_date: "Saturday, May 9, 2025",
      reservation_time: "8:00 PM",
      guest_count: 4,
    },
    order_booking: {
      customer_name: "Jane Doe",
      restaurant_name: businessName,
      order_id: "ORD-9876",
      order_total: "$67.50",
    },
    delivery_update: {
      customer_name: "Jane Doe",
      restaurant_name: businessName,
      order_id: "ORD-9876",
      delivery_status: "Out for delivery",
    },
    booking_cancellation: {
      customer_name: "Jane Doe",
      restaurant_name: businessName,
      reservation_date: "Saturday, May 9, 2025",
      reservation_time: "8:00 PM",
    },
    order_payment_received: {
      customer_name: "Jane Doe",
      restaurant_name: businessName,
      order_id: "ORD-987654",
      order_total: "$67.50",
      payment_method: "Credit Card",
    },
    order_cancellation: {
      customer_name: "Jane Doe",
      restaurant_name: businessName,
      order_id: "ORD-9876",
      order_total: "$67.50",
    },
    reservation_reminder: {
      customer_name: "Jane Doe",
      restaurant_name: businessName,
      reservation_date: "Saturday, May 9, 2025",
      reservation_time: "8:00 PM",
      guest_count: 4,
    },
    reservation_review: {
      customer_name: "Jane Doe",
      restaurant_name: businessName,
      reservation_date: "Saturday, May 9, 2025",
    },
    reservation_refund: {
      customer_name: "Jane Doe",
      restaurant_name: businessName,
      reservation_date: "Saturday, May 9, 2025",
      reservation_time: "8:00 PM",
      refund_amount: "$25.00",
    },
  };

  return templates[key];
}
