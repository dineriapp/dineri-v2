import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { Addon } from "@/lib/types";

export type CartItem = {
    id: string;
    addons: Addon[];
    quantity: number;
    customization?: string;
};

type CartState = {
    carts: Record<string, CartItem[]>;
};

export const useCartStore = create<CartState>()(
    persist(
        immer(() => ({
            carts: {},
        })),
        {
            name: "cart-storage",
        }
    )
);


export function addToCart(slug: string, item: CartItem) {
    useCartStore.setState((state) => {
        const cart = state.carts[slug] || [];
        const existingIndex = cart.findIndex(
            (c) =>
                c.id === item.id &&
                JSON.stringify(c.addons) === JSON.stringify(item.addons) &&
                (c.customization || "") === (item.customization || "")
        );
        if (existingIndex !== -1) {
            cart[existingIndex].quantity += item.quantity;
        } else {
            cart.push(item);
        }
        state.carts[slug] = cart;
    });
}

export function updateCartItemQuantity(slug: string, index: number, delta: number) {
    useCartStore.setState((state) => {
        const cart = state.carts[slug];
        if (!cart) return;
        const newQty = cart[index].quantity + delta;
        if (newQty <= 0) {
            cart.splice(index, 1);
        } else {
            cart[index].quantity = newQty;
        }
        state.carts[slug] = cart;
    });
}

export function removeCartItem(slug: string, index: number) {
    useCartStore.setState((state) => {
        const cart = state.carts[slug];
        if (!cart) return;
        cart.splice(index, 1);
        state.carts[slug] = cart;
    });
}

export function clearCart(slug: string) {
    useCartStore.setState((state) => {
        state.carts[slug] = [];
    });
}

export function pruneInvalidCartItems(slug: string, validItemIds: string[]): CartItem[] {
    const cart = useCartStore.getState().carts[slug] || [];
    const validIds = new Set(validItemIds);
    const removed = cart.filter((c) => !validIds.has(c.id));

    if (removed.length > 0) {
        useCartStore.setState((state) => {
            state.carts[slug] = cart.filter((c) => validIds.has(c.id));
        });
    }

    return removed;
}