export type RestaurantOpeningHours = Record<
    number,
    {
        isOpen: boolean;
        openTime: string | null;
        closeTime: string | null;
    }
>;
export type StatusType = "open" | "closing‑soon" | "opening‑soon" | "closed";

export const DEFAULT_OPENING_HOURS: RestaurantOpeningHours =
{
    0: {
        isOpen: false,
        openTime: null,
        closeTime: null,
    },
    1: {
        isOpen: false,
        openTime: null,
        closeTime: null,
    },
    2: {
        isOpen: false,
        openTime: null,
        closeTime: null,
    },
    3: {
        isOpen: false,
        openTime: null,
        closeTime: null,
    },
    4: {
        isOpen: false,
        openTime: null,
        closeTime: null,
    },
    5: {
        isOpen: false,
        openTime: null,
        closeTime: null,
    },
    6: {
        isOpen: false,
        openTime: null,
        closeTime: null,
    },
};

export const DAYS = [
    { key: "1", label: "Mon" },
    { key: "2", label: "Tue" },
    { key: "3", label: "Wed" },
    { key: "4", label: "Thu" },
    { key: "5", label: "Fri" },
    { key: "6", label: "Sat" },
    { key: "0", label: "Sun" },
] as const;