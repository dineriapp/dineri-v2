import { db } from "@/drizzle/db";
import { eq, sql } from "drizzle-orm";
import { canAdd, getRemainingSlots, getResourceLimit, PlanName } from "./plans";

export async function checkResourceLimit(
  plan: PlanName,
  resource:
    | "links"
    | "gallery"
    | "faq"
    | "events"
    | "popups"
    | "qrCodes"
    | "venues"
    | "menu"
    | "items_per_category",
  restaurantId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any,
): Promise<{ allowed: boolean; remaining: number; error: string }> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(table)
    .where(eq(table.restaurantId, restaurantId));

  const currentCount = result?.count ?? 0;
  const allowed = canAdd(plan, resource, currentCount);
  const remaining = getRemainingSlots(plan, resource, currentCount);
  const maxLimit = getResourceLimit(plan, resource);

  if (!allowed) {
    const limitDisplay = maxLimit === "unlimited" ? "unlimited" : maxLimit;
    const error = `You have reached your plan's ${resource} limit (${plan} plan allows up to ${limitDisplay} ${resource}). You currently have ${currentCount}. Please upgrade to add more.`;
    return {
      allowed: false,
      remaining,
      error,
    };
  }

  return { allowed: true, remaining, error: "" };
}

export async function checkResourceLimitWithCount(
  plan: PlanName,
  resource:
    | "links"
    | "gallery"
    | "faq"
    | "events"
    | "popups"
    | "qrCodes"
    | "venues"
    | "menu"
    | "items_per_category",
  currentCount: number,
): Promise<{ allowed: boolean; remaining: number; error: string }> {
  const allowed = canAdd(plan, resource, currentCount);
  const remaining = getRemainingSlots(plan, resource, currentCount);
  const maxLimit = getResourceLimit(plan, resource);

  if (!allowed) {
    const limitDisplay = maxLimit === "unlimited" ? "unlimited" : maxLimit;
    const error = `You have reached your plan's ${resource} limit (${plan} plan allows up to ${limitDisplay} ${resource}). You currently have ${currentCount}. Please upgrade to add more.`;
    return { allowed: false, remaining, error };
  }
  return { allowed: true, remaining, error: "" };
}
