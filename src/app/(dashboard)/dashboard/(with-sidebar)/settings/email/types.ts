export type ReservationConfirmationData = {
  customer_name: string;
  reservation_date: string;
  reservation_time: string;
  guest_count: number;
  restaurant_name: string;
};

export type OrderBookingData = {
  customer_name: string;
  order_id: string;
  order_total: string;
  restaurant_name: string;
};

export type DeliveryUpdateData = {
  customer_name: string;
  order_id: string;
  delivery_status: string;
  restaurant_name: string;
};

export type BookingCancellationData = {
  customer_name: string;
  reservation_date: string;
  reservation_time: string;
  restaurant_name: string;
};

export type OrderPaymentReceivedData = {
  customer_name: string;
  restaurant_name: string;
  order_id: string;
  order_total: string;
  payment_method: string;
};

export type OrderCancellationData = {
  customer_name: string;
  restaurant_name: string;
  order_id: string;
  order_total: string;
};

export type ReservationReminderData = {
  customer_name: string;
  restaurant_name: string;
  reservation_date: string;
  reservation_time: string;
  guest_count: number;
};

export type ReservationReviewData = {
  customer_name: string;
  restaurant_name: string;
  reservation_date: string;
};

export type ReservationRefundData = {
  customer_name: string;
  restaurant_name: string;
  reservation_date: string;
  reservation_time: string;
  refund_amount: string;
};

export type TemplateDataMap = {
  reservation_confirmation: ReservationConfirmationData;
  order_booking: OrderBookingData;
  delivery_update: DeliveryUpdateData;
  booking_cancellation: BookingCancellationData;
  order_payment_received: OrderPaymentReceivedData;
  order_cancellation: OrderCancellationData;
  reservation_reminder: ReservationReminderData;
  reservation_review: ReservationReviewData;
  reservation_refund: ReservationRefundData;
};

export type TemplateData<K extends keyof TemplateDataMap> = TemplateDataMap[K];

export type EmailTemplate = {
  enabled: boolean;
  subject: string;
  body: string;
};

export type EmailTemplates = Record<
  | "reservation_confirmation"
  | "order_booking"
  | "delivery_update"
  | "booking_cancellation"
  | "order_payment_received"
  | "order_cancellation"
  | "reservation_reminder"
  | "reservation_review"
  | "reservation_refund",
  EmailTemplate
>;
