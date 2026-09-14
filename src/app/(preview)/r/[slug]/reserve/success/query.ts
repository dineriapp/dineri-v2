import { db } from "@/drizzle/db";
import { reservations, restaurant } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";

export const getReservationForSuccessPage = async (slug: string, reservationId: string) => {
  const restaurant_record = await db.query.restaurant.findFirst({
    where: eq(restaurant.slug, slug),
    columns: {
      id: true,
      name: true,
      logo: true,
      appearance_settings: true,
      stripe: true,
    },
  });
  if (!restaurant_record) return null;

  const safeStripe = restaurant_record.stripe
    ? { currency: restaurant_record.stripe.currency ?? null }
    : null;

  const reservation = await db.query.reservations.findFirst({
    where: and(
      eq(reservations.id, reservationId),
      eq(reservations.restaurantId, restaurant_record.id),
    ),
    with: {
      area: { columns: { id: true, name: true } },
    },
  });
  if (!reservation) return null;

  return {
    restaurant: {
      ...restaurant_record,
      stripe: safeStripe,
    },
    reservation,
  };
};

export type ReservationSuccessDataType = NonNullable<
  Awaited<ReturnType<typeof getReservationForSuccessPage>>
>;
