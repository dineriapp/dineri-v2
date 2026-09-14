import { db } from "@/drizzle/db";
import { reservationTables, restaurant } from "@/drizzle/schema";
import { eq, exists } from "drizzle-orm";

export const getRestaurantForReservationPage = async (slug: string) => {
  const restaurant_record = await db.query.restaurant.findFirst({
    where: eq(restaurant.slug, slug),
    columns: {
      id: true,
      name: true,
      logo: true,
      reservation_settings: true,
      reservation_policies: true,
      appearance_settings: true,
      stripe: true,
    },
  });
  if (!restaurant_record) return restaurant_record;

  const areas = await db.query.reservationAreas.findMany({
    where: (a, { and, eq }) =>
      and(
        eq(a.restaurantId, restaurant_record.id),
        exists(
          db
            .select({ id: reservationTables.id })
            .from(reservationTables)
            .where(eq(reservationTables.areaId, a.id)),
        ),
      ),
    columns: {
      id: true,
      name: true,
    },
    orderBy: (a, { asc }) => asc(a.name),
  });

  const { stripe, ...rest } = restaurant_record;

  return { ...rest, currency: stripe?.currency ?? null, areas };
};

export type ReservationPageRestaurantType = Awaited<
  ReturnType<typeof getRestaurantForReservationPage>
>;
