import "server-only";

import { analytics, type AnalyticsEventType } from "@/lib/analytics/analytics";
import { lookupGeo } from "@/lib/analytics/geoip";
import { CLIENT_IP_HEADER, REQUEST_METHOD_HEADER } from "@/lib/rate-limit/ip";
import { resolveTrafficSource } from "@/utils/trafic-source";
import { headers } from "next/headers";
import { after, userAgent } from "next/server";

type SearchParams = Record<string, string | string[] | undefined>;

function decodeHeader(value: string | null): string | undefined {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function TrackVisit({
  slug,
  event,
  searchParams,
}: {
  slug: string;
  event: AnalyticsEventType;
  searchParams?: SearchParams;
}) {
  const h = await headers();

  if ((h.get(REQUEST_METHOD_HEADER) ?? "GET") !== "GET") return null;
  if (h.get("next-router-prefetch") === "1") return null;
  if (h.get("next-router-segment-prefetch")) return null;
  const purpose = (h.get("purpose") ?? h.get("sec-purpose") ?? "").toLowerCase();
  if (purpose.includes("prefetch")) return null;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    for (const v of Array.isArray(value) ? value : value ? [value] : []) params.append(key, v);
  }

  const traffic = resolveTrafficSource({
    searchParams: params,
    referer: h.get("referer"),
    userAgent: h.get("user-agent"),
    host: h.get("host") ?? "",
  });
  const device = userAgent({ headers: h }).device.type ?? "desktop";
  const ip = h.get(CLIENT_IP_HEADER) ?? undefined;
  const headerCountry = h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry") ?? undefined;
  const headerCity = decodeHeader(h.get("x-vercel-ip-city") ?? h.get("cf-ipcity"));

  after(async () => {
    try {
      const geo = headerCountry && headerCity ? {} : await lookupGeo(ip);
      await analytics.track(slug, event, {
        ip,
        country: headerCountry ?? geo.country,
        city: headerCity ?? geo.city,
        device,
        traffic,
      });
    } catch (err) {
      console.error("analytics.track failed", { slug, event, err });
    }
  });

  return null;
}
