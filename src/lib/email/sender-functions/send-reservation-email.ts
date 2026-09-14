import { defaultEmailTemplates } from "@/app/(dashboard)/dashboard/(with-sidebar)/settings/email/constants";
import { buildEmail } from "@/app/(dashboard)/dashboard/(with-sidebar)/settings/email/build-email";
import type {
  BookingCancellationData,
  ReservationConfirmationData,
  ReservationRefundData,
  ReservationReminderData,
  ReservationReviewData,
} from "@/app/(dashboard)/dashboard/(with-sidebar)/settings/email/types";
import { renderTemplate } from "@/app/(dashboard)/dashboard/(with-sidebar)/settings/email/utils";
import { db } from "@/drizzle/db";
import { restaurant } from "@/drizzle/schema";
import {
  PlatformEmailProps,
  publishEmailToQueue,
  RestaurantEmailProps,
} from "@/lib/email-publisher";
import { canUseCustomSmtp, canUseEmail } from "@/lib/stripe/checkers";
import { decrypt } from "@/lib/stripe/encryption";
import { getRestaurantOwnerPlan } from "@/lib/stripe/get-restaurant-owner-plan";
import { eq } from "drizzle-orm";
import { DateTime } from "luxon";

type ReservationTemplateKey =
  | "reservation_confirmation"
  | "booking_cancellation"
  | "reservation_reminder"
  | "reservation_review"
  | "reservation_refund";

export type ReservationEmailInput = {
  restaurantId: string;
  guestName: string;
  guestEmail: string;
  partySize: number;
  date: string;
  time: string;
};

export type ReservationRefundEmailInput = ReservationEmailInput & { refundAmount: string };

export function sendReservationConfirmationEmail(data: ReservationEmailInput): void {
  void send(data, "reservation_confirmation");
}

export function sendReservationCancellationEmail(data: ReservationEmailInput): void {
  void send(data, "booking_cancellation");
}

export function sendReservationReviewEmail(data: ReservationEmailInput): void {
  void send(data, "reservation_review");
}

export function scheduleReservationReminderEmail(data: ReservationEmailInput): void {
  void send(data, "reservation_reminder");
}

export function sendReservationRefundEmail(data: ReservationRefundEmailInput): void {
  void send(data, "reservation_refund");
}

async function send(
  data: ReservationEmailInput | ReservationRefundEmailInput,
  templateKey: ReservationTemplateKey,
): Promise<void> {
  try {
    const restaurantRecord = await db.query.restaurant.findFirst({
      where: eq(restaurant.id, data.restaurantId),
      columns: {
        id: true,
        name: true,
        timezone: true,
        email_config: true,
        email_templates: true,
        reservation_settings: true,
      },
    });

    if (!restaurantRecord) {
      console.error("Restaurant not found for reservation email:", data.restaurantId);
      return;
    }

    const {
      email_config,
      email_templates,
      reservation_settings,
      name: businessName,
      timezone,
    } = restaurantRecord;

    if (!reservation_settings?.notifyEmail) {
      console.warn(`Reservation emails are off for ${businessName} - skipping ${templateKey}`);
      return;
    }

    const plan = await getRestaurantOwnerPlan(restaurantRecord.id);
    if (!canUseEmail(plan)) {
      console.warn("Email not allowed on plan:", plan);
      return;
    }

    const template = email_templates?.[templateKey] ?? defaultEmailTemplates[templateKey];
    if (!template?.enabled) {
      console.warn(`Template ${templateKey} is disabled or missing`);
      return;
    }

    const hhmm = data.time.slice(0, 5);
    const bookingAt = DateTime.fromISO(`${data.date}T${hhmm}`, { zone: timezone });
    if (!bookingAt.isValid) {
      console.error("Invalid reservation date/time for email:", data.date, data.time);
      return;
    }

    let delay: number | undefined;
    if (templateKey === "reservation_reminder") {
      const leadHours = reservation_settings.reminderHours;
      if (!leadHours || leadHours <= 0) {
        console.warn("Reminder lead time not configured - skipping reminder");
        return;
      }

      const remindAt = bookingAt.minus({ hours: leadHours });
      delay = remindAt.diff(DateTime.now().setZone(timezone)).toMillis();

      if (delay <= 0) {
        console.warn(
          `Booking is within its ${leadHours}h reminder window already - skipping reminder`,
        );
        return;
      }
    }

    const reservationDate = bookingAt.toFormat("cccc, LLLL d, yyyy");
    const reservationTime = bookingAt.toFormat("h:mm a");

    let templateData:
      | ReservationConfirmationData
      | BookingCancellationData
      | ReservationReminderData
      | ReservationReviewData
      | ReservationRefundData;

    if (templateKey === "reservation_confirmation") {
      templateData = {
        customer_name: data.guestName,
        restaurant_name: businessName,
        reservation_date: reservationDate,
        reservation_time: reservationTime,
        guest_count: data.partySize,
      };
    } else if (templateKey === "reservation_reminder") {
      templateData = {
        customer_name: data.guestName,
        restaurant_name: businessName,
        reservation_date: reservationDate,
        reservation_time: reservationTime,
        guest_count: data.partySize,
      };
    } else if (templateKey === "reservation_refund") {
      templateData = {
        customer_name: data.guestName,
        restaurant_name: businessName,
        reservation_date: reservationDate,
        reservation_time: reservationTime,
        refund_amount: "refundAmount" in data ? data.refundAmount : "",
      };
    } else if (templateKey === "booking_cancellation") {
      templateData = {
        customer_name: data.guestName,
        restaurant_name: businessName,
        reservation_date: reservationDate,
        reservation_time: reservationTime,
      };
    } else {
      templateData = {
        customer_name: data.guestName,
        restaurant_name: businessName,
        reservation_date: reservationDate,
      };
    }

    const { subject, body } = renderTemplate(template, templateData);
    const fullHtml = buildEmail(body, subject);

    const isCustomAllowed = canUseCustomSmtp(plan);
    const hasValidSmtp = email_config && email_config.isVerified && email_config.testEmail;

    const base = { to: data.guestEmail, subject, html: fullHtml, ...(delay ? { delay } : {}) };

    const emailPayload: PlatformEmailProps | RestaurantEmailProps =
      isCustomAllowed && hasValidSmtp
        ? {
            ...base,
            type: "restaurant",
            smtpHost: email_config.smtpHost,
            smtpPort: email_config.smtpPort,
            smtpSecure: email_config.smtpSecure,
            smtpUsername: email_config.smtpUsername,
            smtpPassword: decrypt(email_config.smtpPassword),
            fromEmail: email_config.fromEmail,
            fromName: email_config.fromName || undefined,
          }
        : { ...base, type: "platform" };

    const result = await publishEmailToQueue(emailPayload);
    if (!result.success) {
      throw new Error(result.error || "Failed to queue email");
    }

    console.log(
      `✅ ${templateKey} queued for ${data.guestEmail}` +
        (delay ? ` (in ${Math.round(delay / 60000)} min)` : ""),
    );
  } catch (error) {
    console.error(`❌ Reservation email failed for ${templateKey}:`, error);
  }
}
