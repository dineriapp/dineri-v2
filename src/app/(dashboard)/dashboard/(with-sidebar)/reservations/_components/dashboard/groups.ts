import type {
  ReservationPaymentStatus,
  ReservationStatus,
} from "@/drizzle/schemas/reservation-schema";

export type ReservationGroupId =
  "awaiting" | "confirmed" | "seated" | "completed" | "cancelled" | "no_show";

export function reservationGroupOf(reservation: {
  status: ReservationStatus;
  paymentStatus: ReservationPaymentStatus;
}): ReservationGroupId {
  const { status, paymentStatus } = reservation;

  switch (status) {
    case "cancelled":
      return "cancelled";
    case "no_show":
      return "no_show";
    case "completed":
      return "completed";
    case "pending":
      return "awaiting";
    case "confirmed":
      return paymentStatus === "pending" ? "awaiting" : "confirmed";
    case "seated":
      return paymentStatus === "pending" ? "awaiting" : "seated";
  }
}
