import { DeviceType } from "@/lib/types";
import { NextRequest, userAgent } from "next/server";

export const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

export function getDeviceType(request: NextRequest): DeviceType {
    const { device } = userAgent(request);

    return (device.type ?? "desktop") as DeviceType;
}