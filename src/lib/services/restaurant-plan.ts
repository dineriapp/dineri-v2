import "server-only";

import { hasFeature } from "@/lib/stripe/checkers";
import { getRestaurantOwnerPlan } from "@/lib/stripe/get-restaurant-owner-plan";
import type { BooleanFeatures } from "@/lib/types/plan-limits";


export async function restaurantHasFeature(
    restaurantId: string,
    feature: BooleanFeatures,
): Promise<boolean> {
    if (!restaurantId) return false;
    return hasFeature(await getRestaurantOwnerPlan(restaurantId), feature);
}

export const ORDERING_NOT_ON_PLAN_ERROR =
    "Online ordering is not available on this restaurant's current plan.";

export const RESERVATIONS_NOT_ON_PLAN_ERROR =
    "Reservations are not available on this restaurant's current plan.";
