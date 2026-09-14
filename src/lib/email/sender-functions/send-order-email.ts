import { db } from "@/drizzle/db";
import { restaurant } from "@/drizzle/schema";
import { formatOrderNumber } from "@/lib/utils";
import { eq } from "drizzle-orm";
import {
  publishEmailToQueue,
  PlatformEmailProps,
  RestaurantEmailProps,
} from "@/lib/email-publisher";
import { decrypt } from "@/lib/stripe/encryption";
import { canUseCustomSmtp, canUseEmail } from "@/lib/stripe/checkers";
import {
  DeliveryUpdateData,
  OrderBookingData,
  OrderCancellationData,
  OrderPaymentReceivedData,
} from "@/app/(dashboard)/dashboard/(with-sidebar)/settings/email/types";
import { renderTemplate } from "@/app/(dashboard)/dashboard/(with-sidebar)/settings/email/utils";
import { buildEmail } from "@/app/(dashboard)/dashboard/(with-sidebar)/settings/email/build-email";
import { getRestaurantOwnerPlan } from "@/lib/stripe/get-restaurant-owner-plan";

interface OrderEmailBase {
  orderNumber: number;
  customerName: string;
  customerEmail: string;
  total: number;
  currency: string;
  restaurantId: string;
}

type OrderBookingEmailData = OrderEmailBase;

interface OrderPaymentEmailData extends OrderEmailBase {
  paymentMethod: string;
}

interface DeliveryUpdateEmailData {
  orderNumber: number;
  customerName: string;
  customerEmail: string;
  restaurantId: string;
  deliveryStatus: string;
  estimatedDelivery?: string;
  total?: number;
  currency?: string;
}

type OrderCancellationEmailData = OrderEmailBase;

export function sendOrderBookingEmail(data: OrderBookingEmailData): void {
  void sendOrderEmailInternal(data, "order_booking");
}

export function sendOrderPaymentReceivedEmail(data: OrderPaymentEmailData): void {
  void sendOrderEmailInternal(data, "order_payment_received");
}

export function sendDeliveryUpdateEmail(data: DeliveryUpdateEmailData): void {
  void sendOrderEmailInternal(data, "delivery_update");
}

export function sendOrderCancellationEmail(data: OrderCancellationEmailData): void {
  void sendOrderEmailInternal(data, "order_cancellation");
}

async function sendOrderEmailInternal(
  data:
    | OrderBookingEmailData
    | OrderPaymentEmailData
    | DeliveryUpdateEmailData
    | OrderCancellationEmailData,
  templateKey:
    "order_booking" | "delivery_update" | "order_payment_received" | "order_cancellation",
): Promise<void> {
  try {
    const restaurantRecord = await db.query.restaurant.findFirst({
      where: eq(restaurant.id, data.restaurantId),
      columns: {
        name: true,
        id: true,
        email_config: true,
        email_templates: true,
      },
    });

    if (!restaurantRecord) {
      console.error("Restaurant not found for email:", data.restaurantId);
      return;
    }

    const { email_config, email_templates, name: businessName } = restaurantRecord;

    const plan = await getRestaurantOwnerPlan(restaurantRecord.id);

    // Plan check
    if (!canUseEmail(plan)) {
      console.warn("Email not allowed on plan:", plan);
      return;
    }

    // Get the template
    const template = email_templates?.[templateKey];
    if (!template || !template.enabled) {
      console.warn(`Template ${templateKey} is disabled or missing`);
      return;
    }

    // Build the data object matching the exact type
    let templateData:
      OrderBookingData | OrderPaymentReceivedData | DeliveryUpdateData | OrderCancellationData;

    if (templateKey === "order_booking") {
      const bookingData = data as OrderBookingEmailData;
      const orderId = formatOrderNumber(bookingData.orderNumber);
      const totalFormatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: bookingData.currency,
      }).format(bookingData.total);
      templateData = {
        customer_name: bookingData.customerName,
        restaurant_name: businessName,
        order_id: orderId,
        order_total: totalFormatted,
      };
    } else if (templateKey === "order_payment_received") {
      const paymentData = data as OrderPaymentEmailData;
      const orderId = formatOrderNumber(paymentData.orderNumber);
      const totalFormatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: paymentData.currency,
      }).format(paymentData.total);
      templateData = {
        customer_name: paymentData.customerName,
        restaurant_name: businessName,
        order_id: orderId,
        order_total: totalFormatted,
        payment_method: paymentData.paymentMethod,
      };
    } else if (templateKey === "order_cancellation") {
      const cancellationData = data as OrderCancellationEmailData;
      const totalFormatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: cancellationData.currency,
      }).format(cancellationData.total);
      templateData = {
        customer_name: cancellationData.customerName,
        restaurant_name: businessName,
        order_id: formatOrderNumber(cancellationData.orderNumber),
        order_total: totalFormatted,
      };
    } else {
      // delivery_update
      const deliveryData = data as DeliveryUpdateEmailData;
      templateData = {
        customer_name: deliveryData.customerName,
        restaurant_name: businessName,
        order_id: formatOrderNumber(deliveryData.orderNumber),
        delivery_status: deliveryData.deliveryStatus,
      };
    }

    // Render
    const { subject, body } = renderTemplate(template, templateData);
    const fullHtml = buildEmail(body, subject);

    // sending method (SMTP or platform)
    const isCustomAllowed = canUseCustomSmtp(plan);
    const hasValidSmtp = email_config && email_config.isVerified && email_config.testEmail;

    let emailPayload: PlatformEmailProps | RestaurantEmailProps;

    if (isCustomAllowed && hasValidSmtp) {
      emailPayload = {
        type: "restaurant",
        to: data.customerEmail,
        subject,
        html: fullHtml,
        smtpHost: email_config.smtpHost,
        smtpPort: email_config.smtpPort,
        smtpSecure: email_config.smtpSecure,
        smtpUsername: email_config.smtpUsername,
        smtpPassword: decrypt(email_config.smtpPassword),
        fromEmail: email_config.fromEmail,
        fromName: email_config.fromName || undefined,
      };
    } else {
      emailPayload = {
        type: "platform",
        to: data.customerEmail,
        subject,
        html: fullHtml,
      };
    }

    // Publish to queue
    const result = await publishEmailToQueue(emailPayload);
    if (!result.success) {
      throw new Error(result.error || "Failed to queue email");
    }

    console.log(`✅ ${templateKey} email sent to ${data.customerEmail}`);
  } catch (error) {
    console.error(`❌ Email sending failed for ${templateKey}:`, error);
  }
}
