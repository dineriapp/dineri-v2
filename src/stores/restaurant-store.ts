import { RestaurantStoreType } from "@/drizzle/types";
import { toPublicSmtpConfig, toPublicStripeConfig } from "@/lib/security/public-config";
import { StripeConfig } from "@/lib/stripe/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface RestaurantState {
    selectedRestaurant: RestaurantStoreType | null;
}

function sanitizePersisted(persisted: unknown): Partial<RestaurantState> {
    const state = persisted as RestaurantState | undefined;
    const restaurant = state?.selectedRestaurant;

    if (!restaurant) return { selectedRestaurant: null };

    return {
        selectedRestaurant: {
            ...restaurant,
            stripe: toPublicStripeConfig(restaurant.stripe),
            email_config: toPublicSmtpConfig(restaurant.email_config),
            pendingEmailConfig: null,
            verificationCode: null,
        },
    };
}

export const useRestaurantStore =
    create<RestaurantState>()(
        persist(
            immer(
                () => ({
                    selectedRestaurant: null,
                })
            ),
            {
                name: "restaurant-store",
                version: 1,
                migrate: (persisted) => sanitizePersisted(persisted) as RestaurantState,
                merge: (persisted, current) => ({ ...current, ...sanitizePersisted(persisted) }),
            }
        )
    );

export function clearSelectedRestaurant() {
    useRestaurantStore.setState({ selectedRestaurant: null });
    try {
        useRestaurantStore.persist?.clearStorage();
    } catch {
        // nothing persisted to clear
    }
}

export function setSelectedRestaurant(restaurant: RestaurantStoreType, refresh = false) {
    useRestaurantStore.setState(s => {
        s.selectedRestaurant = restaurant
    })
    if (refresh) {
        window.location.reload();
    }
}

export function updateSelectedRestaurant(updates: Partial<RestaurantStoreType>) {
    const current = useRestaurantStore.getState().selectedRestaurant;
    if (!current) return;
    useRestaurantStore.setState({
        selectedRestaurant: { ...current, ...updates, },
    });
}

export function updateRestaurantStripeSecret(
    stripe: Partial<StripeConfig>
) {
    const current =
        useRestaurantStore.getState()
            .selectedRestaurant;

    if (!current) return;

    useRestaurantStore.setState({
        selectedRestaurant: {
            ...current,
            stripe: {
                ...(current.stripe ?? {}),
                ...stripe,
            } as StripeConfig,
        },
    });
}

export function useSelectedRestaurant() {
    const restaurant =
        useRestaurantStore(
            (s) => s.selectedRestaurant
        );

    if (!restaurant) {
        throw new Error(
            "Selected restaurant not found"
        );
    }

    return restaurant;
}