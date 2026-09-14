"use server";

import { and, asc, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { events, restaurant } from "@/drizzle/schema";
import { EventType } from "@/drizzle/types";
import { logMerchantActivity } from "@/lib/activity/log";
import { ensureAuthenticatedUser, ensureAuthenticatedUserLean } from "@/lib/auth/guards";
import { ApiResponse } from "@/lib/types";
import { makeEventSchema, EventSchemaType } from "@/lib/tanstack-react-query/hooks/event.schema";
import { DEFAULT_EVENT_TIMEZONE } from "@/lib/services/event-visibility";
import { checkResourceLimit } from "@/lib/stripe/resource-guard";

async function getRestaurantTimezone(restaurantId: string): Promise<string> {
  const record = await db.query.restaurant.findFirst({
    where: eq(restaurant.id, restaurantId),
    columns: { timezone: true },
  });
  return record?.timezone ?? DEFAULT_EVENT_TIMEZONE;
}

export async function getEvents(): Promise<ApiResponse<EventType[]>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }

    const { activeRestaurantId } = auth.session.user;

    const eventList = await db.query.events.findMany({
      where: eq(events.restaurantId, activeRestaurantId),
      orderBy: [asc(events.sort_order)],
    });

    return {
      success: true,
      data: eventList,
    };
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return {
      success: false,
      error: "Failed to fetch events",
    };
  }
}

export async function createEvent(input: EventSchemaType): Promise<ApiResponse<{ id: string }>> {
  try {
    const auth = await ensureAuthenticatedUser();
    if (!auth.session) {
      return auth.json;
    }

    const {
      activeRestaurantId,
      subscription: { plan },
    } = auth.session.user;

    const timezone = await getRestaurantTimezone(activeRestaurantId);
    const parsed = makeEventSchema({ timezone }).safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const limitCheck = await checkResourceLimit(plan, "events", activeRestaurantId, events);
    if (!limitCheck.allowed) {
      return { success: false, error: limitCheck.error };
    }

    // Get last sort_order for this restaurant
    const lastEvent = await db.query.events.findFirst({
      where: eq(events.restaurantId, activeRestaurantId),
      orderBy: (e, { desc }) => [desc(e.sort_order)],
      columns: { sort_order: true },
    });
    const sort_order = (lastEvent?.sort_order ?? -1) + 1;

    const [newEvent] = await db
      .insert(events)
      .values({
        restaurantId: activeRestaurantId,
        title: parsed.data.title,
        date: parsed.data.date,
        time: parsed.data.time,
        location: parsed.data.location,
        description: parsed.data.description,
        buttonText: parsed.data.buttonText?.trim() || null,
        buttonLink: parsed.data.buttonLink?.trim() || null,
        active: parsed.data.active,
        sort_order,
      })
      .returning({ id: events.id });
    logMerchantActivity(auth.session.user, {
      type: "event.created",
      entityId: newEvent.id,
      data: { name: parsed.data.title },
    });

    return {
      success: true,
      data: { id: newEvent.id },
    };
  } catch (error) {
    console.error("Failed to create event:", error);
    return {
      success: false,
      error: "Failed to create event",
    };
  }
}

export async function updateEvent(
  id: string,
  input: EventSchemaType,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }

    const { activeRestaurantId } = auth.session.user;

    // Verify event belongs to this restaurant
    const existing = await db.query.events.findFirst({
      where: and(eq(events.id, id), eq(events.restaurantId, activeRestaurantId)),
      columns: { id: true, title: true, date: true, time: true },
    });
    if (!existing) {
      return {
        success: false,
        error: "Event not found or access denied",
      };
    }

    const timezone = await getRestaurantTimezone(activeRestaurantId);
    const parsed = makeEventSchema({
      timezone,
      existing: { date: existing.date, time: existing.time },
    }).safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    await db
      .update(events)
      .set({
        title: parsed.data.title,
        date: parsed.data.date,
        time: parsed.data.time,
        location: parsed.data.location,
        description: parsed.data.description,
        buttonText: parsed.data.buttonText?.trim() || null,
        buttonLink: parsed.data.buttonLink?.trim() || null,
        active: parsed.data.active,
      })
      .where(eq(events.id, id));
    logMerchantActivity(auth.session.user, {
      type: "event.updated",
      entityId: id,
      data: { name: parsed.data.title },
    });

    return {
      success: true,
      data: { id },
    };
  } catch (error) {
    console.error("Failed to update event:", error);
    return {
      success: false,
      error: "Failed to update event",
    };
  }
}

export async function toggleEventActive(
  id: string,
  active: boolean,
): Promise<ApiResponse<{ id: string; active: boolean }>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }

    const { activeRestaurantId } = auth.session.user;

    // Fetch the event to check if it has already ended
    const event = await db.query.events.findFirst({
      where: and(eq(events.id, id), eq(events.restaurantId, activeRestaurantId)),
      columns: {
        id: true,
        title: true,
      },
    });
    if (!event) {
      return {
        success: false,
        error: "Event not found or access denied",
      };
    }

    await db.update(events).set({ active }).where(eq(events.id, id));

    logMerchantActivity(auth.session.user, {
      type: "event.updated",
      entityId: id,
      data: { name: `${event.title} · ${active ? "shown" : "hidden"}` },
    });

    return {
      success: true,
      data: { id, active },
    };
  } catch (error) {
    console.error("Failed to toggle event:", error);
    return {
      success: false,
      error: "Failed to update event visibility",
    };
  }
}

export async function deleteEvent(id: string): Promise<ApiResponse<{ id: string }>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }

    const { activeRestaurantId } = auth.session.user;

    // Verify event belongs to this restaurant
    const existing = await db.query.events.findFirst({
      where: and(eq(events.id, id), eq(events.restaurantId, activeRestaurantId)),
      columns: { id: true, title: true },
    });
    if (!existing) {
      return {
        success: false,
        error: "Event not found or access denied",
      };
    }

    await db.delete(events).where(eq(events.id, id));
    logMerchantActivity(auth.session.user, {
      type: "event.deleted",
      entityId: id,
      data: { name: existing.title },
    });

    return {
      success: true,
      data: { id },
    };
  } catch (error) {
    console.error("Failed to delete event:", error);
    return {
      success: false,
      error: "Failed to delete event",
    };
  }
}
