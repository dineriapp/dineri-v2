import { geolocation, ipAddress, waitUntil } from "@vercel/functions";
import { NextRequest, NextResponse } from "next/server";
import { analytics, AnalyticsEventType } from "./lib/analytics/analytics";
import { consume } from "./lib/rate-limit/core";
import { isRateLimitExempt } from "./lib/rate-limit/exempt";
import {
  isPrefetchRequest,
  prefersJson,
  tooManyRequestsJson,
  tooManyRequestsPage,
} from "./lib/rate-limit/http";
import {
  CLIENT_IP_HEADER,
  clientIpHeaderValue,
  describeProxyTrust,
  resolveClientIp,
  type ResolvedClientIp,
} from "./lib/rate-limit/ip";
import { globalKey, globalPrefetchKey } from "./lib/rate-limit/keys";
import { RATE_LIMITS, type RateLimitPolicy } from "./lib/rate-limit/policies";
import { getDeviceType } from "./utils/global";
import { getTrafficSource } from "./utils/trafic-source";

const GLOBAL_POLICY: RateLimitPolicy = RATE_LIMITS.global;
const PREFETCH_POLICY: RateLimitPolicy = RATE_LIMITS.globalPrefetch;

console.info(describeProxyTrust());

async function enforceGlobalLimit(req: NextRequest, bucket: string): Promise<Response | null> {
  const prefetch = isPrefetchRequest(req);
  const result = await consume(
    prefetch ? globalPrefetchKey(bucket) : globalKey(bucket),
    prefetch ? PREFETCH_POLICY : GLOBAL_POLICY,
  );

  if (result.allowed) return null;

  return prefersJson(req, req.nextUrl.pathname)
    ? tooManyRequestsJson(result)
    : tooManyRequestsPage(result);
}

const INTERNAL_ONLY_HEADERS = ["x-skip-enrichment"];

function sanitizeForwardingHeaders(req: NextRequest, resolved: ResolvedClientIp): Headers {
  const headers = new Headers(req.headers);
  headers.set(CLIENT_IP_HEADER, clientIpHeaderValue(resolved));
  if (!resolved.trusted) {
    headers.delete("x-forwarded-for");
    headers.delete("x-real-ip");
  }
  for (const header of INTERNAL_ONLY_HEADERS) {
    headers.delete(header);
  }
  return headers;
}

function trackPageview(req: NextRequest, pathname: string) {
  const cleanPath = pathname.replace(/\/$/, "");
  // must start with /r/
  if (!cleanPath.startsWith("/r/")) {
    return;
  }
  if (cleanPath.endsWith("/track-order")) {
    return;
  }
  // detect route type
  const isMenu = cleanPath.endsWith("/menu");
  const isReserve = cleanPath.endsWith("/reserve");
  // extract slug safely
  const slug = cleanPath.replace(/^\/r\//, "").replace(/\/(menu|reserve)$/, "");

  // fallback guard
  if (!slug) {
    return;
  }
  const geo = geolocation(req);
  const ip = ipAddress(req);
  const viewport = getDeviceType(req);
  const traffic = getTrafficSource(req);
  // event type
  let eventType: AnalyticsEventType = "pageview";
  if (isMenu) {
    eventType = "menu";
  } else if (isReserve) {
    eventType = "reserve";
  }
  waitUntil(
    analytics
      .track(slug, eventType, {
        ip,
        country: geo?.country,
        city: geo?.city,
        device: viewport,
        traffic,
      })
      .catch((err) => {
        console.error("analytics.track failed", { slug, eventType, err });
      }),
  );
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const resolved = resolveClientIp(req.headers);
  try {
    if (!isRateLimitExempt(pathname)) {
      const blocked = await enforceGlobalLimit(req, resolved.bucket);
      if (blocked) {
        return blocked;
      }
    }
  } catch (err) {
    console.error("Global rate limit failed", err);
  }
  try {
    trackPageview(req, pathname);
  } catch (err) {
    console.error(err);
  }
  return NextResponse.next({
    request: { headers: sanitizeForwardingHeaders(req, resolved) },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:css|js|mjs|map|json|txt|xml|webmanifest|ico|png|jpg|jpeg|gif|webp|avif|svg|bmp|woff|woff2|ttf|otf|eot|mp4|webm|mp3|pdf)$).*)",
  ],
};
