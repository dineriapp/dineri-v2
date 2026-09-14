"use client";

import { RestaurantType } from "@/drizzle/types";
import { getRestaurantStatus } from "@/lib/services/restaurant-status";
import { useEffect, useState } from "react";

export function useRestaurantOpen(restaurant: Pick<RestaurantType, "opening_hours" | "timezone">) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const update = () => {
            const { opening_hours, timezone } = restaurant;

            if (!opening_hours || !timezone) {
                setIsOpen(false);
                return;
            }

            try {
                const clientTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                const result = getRestaurantStatus(opening_hours, timezone, clientTz);

                if ("isOpen" in result) {
                    setIsOpen(result.isOpen);
                } else {
                    setIsOpen(false);
                }
            } catch {
                setIsOpen(false);
            }
        };

        update();

        const interval = setInterval(update, 60_000);
        return () => clearInterval(interval);
    }, [restaurant]);

    return isOpen;
}