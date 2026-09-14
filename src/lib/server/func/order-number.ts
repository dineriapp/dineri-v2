import "server-only";

import { db } from "@/drizzle/db";
import { restaurant } from "@/drizzle/schema";
import { eq, sql } from "drizzle-orm";

export async function getNextOrderNumber(restaurantId: string): Promise<number> {
    const [row] = await db
        .update(restaurant)
        .set({ nextOrderNumber: sql`${restaurant.nextOrderNumber} + 1` })
        .where(eq(restaurant.id, restaurantId))
        .returning({ assigned: sql<number>`${restaurant.nextOrderNumber} - 1` });

    if (!row) {
        throw new Error("Restaurant not found");
    }

    return row.assigned;
}
