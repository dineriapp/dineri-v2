import { db } from "@/drizzle/db";
import { reservations } from "@/drizzle/schema";
import { ensureAuthenticatedUserLean } from "@/lib/auth/guards";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import ReservationTicketPage from "./client-page";

export async function getReservationById(reservationId: string) {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return null;
    }
    const { activeRestaurantId } = auth.session.user;
    const reservation = await db.query.reservations.findFirst({
      where: and(
        eq(reservations.id, reservationId),
        eq(reservations.restaurantId, activeRestaurantId),
      ),
      with: {
        area: { columns: { id: true, name: true } },
        restaurant: {
          columns: {
            name: true,
            logo: true,
            stripe: true,
          },
        },
      },
    });
    if (!reservation) return null;
    const { stripe, ...restaurant } = reservation.restaurant;

    return {
      ...reservation,
      restaurant: {
        ...restaurant,
        stripe: stripe
          ? {
              currency: stripe.currency ?? null,
            }
          : null,
      },
    };
  } catch {
    return null;
  }
}

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const reservation = await getReservationById(id);

  if (!reservation) {
    return notFound();
  }

  return <ReservationTicketPage reservation={reservation} />;
};

export default Page;
