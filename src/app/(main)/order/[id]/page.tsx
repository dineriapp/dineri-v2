import { db } from "@/drizzle/db";
import { orders } from "@/drizzle/schema";
import { ensureAuthenticatedUserLean } from "@/lib/auth/guards";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import OrderReceiptPage from "./client-page";

export async function getOrderById(orderId: string) {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return null;
    }
    const { activeRestaurantId } = auth.session.user;
    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.restaurantId, activeRestaurantId)),
      with: {
        items: true,
        restaurant: {
          columns: {
            name: true,
            logo: true,
          },
        },
      },
    });
    if (!order) return null;
    return order;
  } catch {
    return null;
  }
}

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    return notFound();
  }
  return <OrderReceiptPage order={order} />;
};

export default Page;
