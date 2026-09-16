import { absoluteUrl } from "@/lib/seo";
import { hostnameOf, isVenueMode, venueSiteUrl } from "@/lib/venue-url";
import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

const PLATFORM_DISALLOW = [
  "/dashboard",
  "/admin",
  "/onboarding",
  "/api/",
  "/sign-in",
  "/sign-up",
  "/verify",
  "/reset-password",
  "/forgot-password",
  "/reservation/",
  "/order/",
  "/preview",
];

const VENUE_DISALLOW = ["/*/reserve/success", "/*/menu/order/success", "/*/track-order", "/api/"];

const PLATFORM_VENUE_DISALLOW = [
  "/r/*/reserve/success",
  "/r/*/menu/order/success",
  "/r/*/track-order",
];

async function requestIsVenueHost(): Promise<boolean> {
  const venue = venueSiteUrl();
  if (!venue) return false;
  const host = (await headers()).get("host")?.toLowerCase().split(":")[0] ?? "";
  return host === hostnameOf(venue);
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  if (await requestIsVenueHost()) {
    return {
      rules: [{ userAgent: "*", allow: "/", disallow: VENUE_DISALLOW }],
      sitemap: `${venueSiteUrl()}/sitemap.xml`,
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: isVenueMode()
          ? PLATFORM_DISALLOW
          : [...PLATFORM_DISALLOW, ...PLATFORM_VENUE_DISALLOW],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
