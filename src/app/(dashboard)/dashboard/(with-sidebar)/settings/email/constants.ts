import { EmailTemplates } from "./types";

export const templatePlaceholders: Record<keyof EmailTemplates, string[]> = {
  reservation_confirmation: [
    "{{customer_name}}",
    "{{restaurant_name}}",
    "{{reservation_date}}",
    "{{reservation_time}}",
    "{{guest_count}}",
  ],
  order_booking: ["{{customer_name}}", "{{restaurant_name}}", "{{order_id}}", "{{order_total}}"],
  delivery_update: [
    "{{customer_name}}",
    "{{restaurant_name}}",
    "{{order_id}}",
    "{{delivery_status}}",
  ],
  booking_cancellation: [
    "{{customer_name}}",
    "{{restaurant_name}}",
    "{{reservation_date}}",
    "{{reservation_time}}",
  ],
  order_payment_received: [
    "{{customer_name}}",
    "{{restaurant_name}}",
    "{{order_id}}",
    "{{order_total}}",
    "{{payment_method}}",
  ],
  order_cancellation: [
    "{{customer_name}}",
    "{{restaurant_name}}",
    "{{order_id}}",
    "{{order_total}}",
  ],
  reservation_reminder: [
    "{{customer_name}}",
    "{{restaurant_name}}",
    "{{reservation_date}}",
    "{{reservation_time}}",
    "{{guest_count}}",
  ],
  reservation_review: ["{{customer_name}}", "{{restaurant_name}}", "{{reservation_date}}"],
  reservation_refund: [
    "{{customer_name}}",
    "{{restaurant_name}}",
    "{{reservation_date}}",
    "{{reservation_time}}",
    "{{refund_amount}}",
  ],
};

export const defaultEmailTemplates: EmailTemplates = {
  reservation_confirmation: {
    enabled: true,
    subject: `Your reservation at {{restaurant_name}} is confirmed`,
    body: `Dear {{customer_name}},\n\nThank you for choosing {{restaurant_name}}.\n\nWe are pleased to confirm your reservation - your booking has been successfully received and secured.\n\nReservation details:\n\n• Date: {{reservation_date}}\n• Time: {{reservation_time}}\n• Party size: {{guest_count}}\n• Venue: {{restaurant_name}}\n\nIf you need to make any changes, or have any questions before your reservation, please don't hesitate to get in touch - simply reply to this email and our team will be glad to help.\n\nWe look forward to serving you and making your experience exceptional.\n\nKind regards,\n{{restaurant_name}}`,
  },
  order_booking: {
    enabled: true,
    subject: `We've received your order {{order_id}}`,
    body: `Dear {{customer_name}},\n\nThank you for your order.\n\nWe are happy to let you know that your order has been successfully booked and is now being prepared.\n\nOrder details:\n\n• Order number: {{order_id}}\n• Order total: {{order_total}}\n\nOur team is processing your order, and we'll keep you informed at every stage.\n\nThank you for choosing {{restaurant_name}} - we appreciate your trust and look forward to delivering your order.\n\nBest regards,\n{{restaurant_name}}`,
  },
  delivery_update: {
    enabled: true,
    subject: `Update on your order {{order_id}}: {{delivery_status}}`,
    body: `Dear {{customer_name}},\n\nGood news - there's an update on your order, and it's on its way to you.\n\nDelivery information:\n\n• Order number: {{order_id}}\n• Current status: {{delivery_status}}\n\nYou'll receive further updates at each stage until your order arrives. If you have any questions in the meantime, simply reply to this email and our team will be glad to help.\n\nThank you for choosing {{restaurant_name}} - we hope you enjoy your order.\n\nBest regards,\n{{restaurant_name}}`,
  },
  booking_cancellation: {
    enabled: true,
    subject: `Your reservation at {{restaurant_name}} has been cancelled`,
    body: `Dear {{customer_name}},\n\nThis email confirms that your booking at {{restaurant_name}} has been successfully cancelled as requested.\n\nCancellation details:\n\n• Date: {{reservation_date}}\n• Time: {{reservation_time}}\n\nIf you were eligible for a refund, it will be processed according to our refund policy and issued to your original payment method within the stated processing period.\n\nWe're sorry to see you cancel, and we hope to have the opportunity to serve you in the future. If you have any questions, please feel free to reply to this email and our team will be happy to help.\n\nKind regards,\n{{restaurant_name}}`,
  },
  order_payment_received: {
    enabled: true,
    subject: `Payment confirmed for order {{order_id}}`,
    body: `Dear {{customer_name}},\n\nThank you for your payment.\n\nWe have successfully received your payment, and your order is now confirmed.\n\nPayment summary:\n\n• Order number: {{order_id}}\n• Amount paid: {{order_total}}\n• Payment method: {{payment_method}}\n\nOur team has started processing your order, and we'll notify you as soon as there's an update.\n\nThank you for choosing {{restaurant_name}} - we truly appreciate your business.\n\nWarm regards,\n{{restaurant_name}}`,
  },
  order_cancellation: {
    enabled: true,
    subject: `Your order {{order_id}} at {{restaurant_name}} has been cancelled`,
    body: `Dear {{customer_name}},\n\nThis email confirms that your order at {{restaurant_name}} has been cancelled.\n\nOrder details:\n\n• Order number: {{order_id}}\n• Order total: {{order_total}}\n\nIf you were charged for this order, any eligible refund will be processed according to our refund policy and issued to your original payment method within the stated processing period.\n\nWe're sorry for any inconvenience. If you have any questions, please feel free to reply to this email and our team will be happy to help.\n\nKind regards,\n{{restaurant_name}}`,
  },
  reservation_reminder: {
    enabled: true,
    subject: `Reminder: your table at {{restaurant_name}} is coming up`,
    body: `Dear {{customer_name}},\n\nThis is a friendly reminder about your upcoming reservation at {{restaurant_name}}.\n\nReservation details:\n\n• Date: {{reservation_date}}\n• Time: {{reservation_time}}\n• Party size: {{guest_count}}\n• Venue: {{restaurant_name}}\n\nWe're looking forward to welcoming you. Please arrive a few minutes early so we can seat you promptly.\n\nIf your plans have changed, or you need to adjust anything about your booking, just reply to this email and our team will take care of it.\n\nSee you soon,\n{{restaurant_name}}`,
  },
  reservation_review: {
    enabled: true,
    subject: `How was your visit to {{restaurant_name}}?`,
    body: `Dear {{customer_name}},\n\nThank you for dining with us at {{restaurant_name}} on {{reservation_date}}. It was a pleasure to host you.\n\nWe'd love to hear how everything was. Your feedback helps us understand what we're getting right and where we can do better for you and every guest who follows.\n\nIf you have a moment, simply reply to this email and let us know about your experience - the food, the service, the atmosphere, anything at all.\n\nThank you again for choosing us. We hope to welcome you back soon.\n\nWarm regards,\n{{restaurant_name}}`,
  },
  reservation_refund: {
    enabled: true,
    subject: `Your refund from {{restaurant_name}} has been issued`,
    body: `Dear {{customer_name}},\n\nThis email confirms that a refund has been issued for your booking at {{restaurant_name}}.\n\nRefund details:\n\n• Amount refunded: {{refund_amount}}\n• Booking date: {{reservation_date}}\n• Booking time: {{reservation_time}}\n\nThe refund has been sent back to your original payment method. Depending on your bank or card issuer, it typically takes 5-10 business days to appear on your statement.\n\nIf you have any questions about this refund, simply reply to this email and our team will be glad to help.\n\nKind regards,\n{{restaurant_name}}`,
  },
};
