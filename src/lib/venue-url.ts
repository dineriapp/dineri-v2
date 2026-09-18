import { siteUrl } from "./seo";

const LOCALHOST = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

export function venueSiteUrl(): string | null {
  const configured = (process.env.NEXT_PUBLIC_VENUE_SITE_URL ?? "").trim().replace(/\/+$/, "");
  if (!configured) return null;

  if (process.env.NODE_ENV === "production") {
    if (LOCALHOST.test(configured) || !configured.startsWith("https://")) {
      throw new Error(
        `NEXT_PUBLIC_VENUE_SITE_URL is "${configured}". In production it must be the public https:// ` +
          "origin of the venue site, or every venue canonical and QR target will point somewhere unreachable.",
      );
    }
  }

  return configured;
}

export const isVenueMode = (): boolean => venueSiteUrl() !== null;

function subpath(sub?: string): string {
  if (!sub) return "";
  return sub.startsWith("/") ? sub : `/${sub}`;
}

export function venuePath(slug: string, sub?: string): string {
  const encoded = encodeURIComponent(slug);
  return isVenueMode() ? `/${encoded}${subpath(sub)}` : `/r/${encoded}${subpath(sub)}`;
}

export function venueUrl(slug: string, sub?: string): string {
  return `${venueSiteUrl() ?? siteUrl()}${venuePath(slug, sub)}`;
}

export function venueDisplayUrl(slug: string, sub?: string): string {
  return venueUrl(slug, sub).replace(/^https?:\/\//, "");
}

export function hostnameOf(url: string | null | undefined): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}
