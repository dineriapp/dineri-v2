
export type ApiResponse<T> =
    | {
        success: true;
        data: T;
        error?: never;
    }
    | {
        success: false;
        error: string;
        data?: never;
    };

export type Addon = {
    label: string;
    price: number;
};

export type Tag = string;

export type DeviceType =
    | "desktop"
    | "mobile"
    | "tablet"
    | "console"
    | "smarttv"
    | "wearable"
    | "embedded";