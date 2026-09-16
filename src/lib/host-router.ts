import { isReservedSlug, isValidSlugShape } from "./reserved-slugs";

export type RouteDecision =
  | { kind: "next" }
  | { kind: "rewrite"; to: string }
  | { kind: "redirect"; to: string; status: 301 | 302 };

export type HostRouterConfig = {
  platformHost: string;
  platformOrigin: string;
  venueHost: string | null;
  venueOrigin: string | null;
};

const VENUE_SUBPATHS = new Set([
  "",
  "/menu",
  "/menu/order/success",
  "/reserve",
  "/reserve/success",
  "/track-order",
]);

function isPassThroughPath(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/favicon.ico" ||
    /\.[a-z0-9]+$/i.test(pathname)
  );
}

const stripTrailingSlash = (p: string): string => (p.length > 1 ? p.replace(/\/+$/, "") : p);

function parseVenuePath(pathname: string): { slug: string; sub: string } | null {
  const clean = stripTrailingSlash(pathname);
  const match = clean.match(/^\/([^/]+)(\/.*)?$/);
  if (!match) return null;

  const slug = decodeURIComponent(match[1]);
  const sub = match[2] ?? "";

  if (!isValidSlugShape(slug) || isReservedSlug(slug)) return null;
  if (!VENUE_SUBPATHS.has(sub)) return null;

  return { slug, sub };
}

export function routeRequest(
  host: string,
  pathname: string,
  search: string,
  config: HostRouterConfig,
): RouteDecision {
  const hostname = host.toLowerCase().split(":")[0];
  const venueMode = !!config.venueHost && !!config.venueOrigin;

  if (venueMode && hostname === config.venueHost) {
    if (isPassThroughPath(pathname)) {
      return { kind: "next" };
    }

    if (stripTrailingSlash(pathname) === "/") {
      return { kind: "redirect", to: `${config.platformOrigin}/${search}`, status: 301 };
    }

    const legacy = pathname.match(/^\/r(\/.*)?$/);
    if (legacy) {
      const rest = legacy[1] ?? "/";
      const parsed = parseVenuePath(rest);
      if (parsed) {
        return {
          kind: "redirect",
          to: `${config.venueOrigin}/${encodeURIComponent(parsed.slug)}${parsed.sub}${search}`,
          status: 301,
        };
      }
    }

    const parsed = parseVenuePath(pathname);
    if (parsed) {
      return {
        kind: "rewrite",
        to: `/r/${encodeURIComponent(parsed.slug)}${parsed.sub}${search}`,
      };
    }

    return { kind: "redirect", to: `${config.platformOrigin}${pathname}${search}`, status: 302 };
  }

  const legacy = pathname.match(/^\/r\/([^/]+)(\/.*)?$/);
  if (legacy) {
    const slug = decodeURIComponent(legacy[1]);
    const sub = (legacy[2] ?? "").replace(/\/+$/, "");

    if (venueMode) {
      return {
        kind: "redirect",
        to: `${config.venueOrigin}/${encodeURIComponent(slug)}${sub}${search}`,
        status: 301,
      };
    }

    return { kind: "next" };
  }

  return { kind: "next" };
}
