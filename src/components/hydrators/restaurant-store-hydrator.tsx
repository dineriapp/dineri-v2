"use client";

import { RestaurantStoreType } from "@/drizzle/types";
import { setSelectedRestaurant } from "@/stores/restaurant-store";
import { useEffect } from "react";

export function RestaurantStoreHydrator({
    restaurant,
}: {
    restaurant: RestaurantStoreType | null;
}) {
    useEffect(() => {
        if (restaurant) {
            setSelectedRestaurant(restaurant);
        }
    }, [restaurant]);

    return null;
}