import { NextRequest, NextResponse } from "next/server";

import { routeRequest, type HostRouterConfig } from "./lib/host-router";
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
  REQUEST_METHOD_HEADER,
  clientIpHeaderValue,
  describeProxyTrust,
  resolveClientIp,
  type ResolvedClientIp,
} from "./lib/rate-limit/ip";
import { globalKey, globalPrefetchKey } from "./lib/rate-limit/keys";
import { RATE_LIMITS, type RateLimitPolicy } from "./lib/rate-limit/policies";
import { siteUrl } from "./lib/seo";
import { hostnameOf, venueSiteUrl } from "./lib/venue-url";

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
  headers.set(REQUEST_METHOD_HEADER, req.method);
  if (!resolved.trusted) {
    headers.delete("x-forwarded-for");
    headers.delete("x-real-ip");
  }
  for (const header of INTERNAL_ONLY_HEADERS) {
    headers.delete(header);
  }
  return headers;
}
const HOST_ROUTER: HostRouterConfig = (() => {
  const platformOrigin = siteUrl();
  const venueOrigin = venueSiteUrl();
  return {
    platformHost: hostnameOf(platformOrigin),
    platformOrigin,
    venueHost: venueOrigin ? hostnameOf(venueOrigin) : null,
    venueOrigin,
  };
})();

function requestHost(req: NextRequest): string {
  return req.headers.get("host") ?? req.headers.get("x-forwarded-host") ?? "";
}

export default async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
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

  const decision = routeRequest(requestHost(req), pathname, search, HOST_ROUTER);

  if (decision.kind === "redirect") {
    return NextResponse.redirect(decision.to, decision.status);
  }

  const headers = sanitizeForwardingHeaders(req, resolved);

  if (decision.kind === "rewrite") {
    return NextResponse.rewrite(new URL(decision.to, req.url), { request: { headers } });
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:css|js|mjs|map|json|txt|xml|webmanifest|ico|png|jpg|jpeg|gif|webp|avif|svg|bmp|woff|woff2|ttf|otf|eot|mp4|webm|mp3|pdf)$).*)",
  ],
};
