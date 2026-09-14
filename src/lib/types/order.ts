type RestaurantOpStatus = "open" | "closed" | "no-delivery" | "no-pickup";

export interface RestaurantOrderSettings {
    status: RestaurantOpStatus;
    deliveryFee: number;
    taxRate: number;
}

export const DEFAULT_RESTAURANT_ORDER_SETTINGS: RestaurantOrderSettings = {
    status: "closed",
    deliveryFee: 5,
    taxRate: 8,
};