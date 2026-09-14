import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { StripeCurrency } from "./stripe/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const acceptedTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4"
];

export function formatPrice(
  amount: number | string,
  currency: StripeCurrency
) {
  const amt = typeof amount === "string" ? Number(amount) : amount;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amt);
}

export function formatOrderNumber(orderNumber: number): string {
  return `ORD-${orderNumber}`;
}

export type Meridiem = "AM" | "PM";

/** Splits a stored "HH:mm" into its 12-hour parts. Null when unparseable. */
export function from24Hour(
  value: string,
): { hour12: number; minute: number; meridiem: Meridiem } | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)/.exec(value);
  if (!match) return null;
  const h = Number(match[1]);
  return {
    hour12: h % 12 === 0 ? 12 : h % 12,
    minute: Number(match[2]),
    meridiem: h < 12 ? "AM" : "PM",
  };
}

/** "22:00" -> "10:00 PM". Display only; stored times stay 24-hour. */
export function formatTimeLabel(value: string): string {
  const parts = from24Hour(value);
  if (!parts) return value;
  return `${parts.hour12}:${String(parts.minute).padStart(2, "0")} ${parts.meridiem}`;
}

export const timeAgo = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
};

export function getS3KeyFromUrl(url: string): string {
  try {
    const { pathname } = new URL(url);
    return decodeURIComponent(pathname.slice(1));
  } catch {
    return "";
  }
}

const regionNames = new Intl.DisplayNames(["en"], {
  type: "region",
});

export function getCountryName(code: string): string {
  return regionNames.of(code.toUpperCase()) ?? code;
}
