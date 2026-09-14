import { NextRequest } from "next/server";
import { UTM_MEDIUM_PARAM, UTM_SOURCE_PARAM } from "@/lib/analytics/utm";

export const KNOWN_TRAFFIC_SOURCES = [
  "direct",
  "qr",
  "social",
  "google",
  "bing",
  "duckduckgo",
  "yahoo",
  "facebook",
  "instagram",
  "x",
  "tiktok",
  "linkedin",
  "reddit",
  "youtube",
  "pinterest",
  "snapchat",
  "whatsapp",
  "messenger",
  "telegram",
] as const;

export type KnownTrafficSource = (typeof KNOWN_TRAFFIC_SOURCES)[number];

export type TrafficSource = KnownTrafficSource | (string & Record<never, never>);

type RefererRule = {
  source: KnownTrafficSource;
  domains?: string[];
  pattern?: RegExp;
};

const REFERER_RULES: RefererRule[] = [
  // Search
  { source: "google", pattern: /(^|\.)google\.[a-z]{2,}(\.[a-z]{2,})?$/ },
  { source: "bing", domains: ["bing.com"] },
  { source: "duckduckgo", domains: ["duckduckgo.com"] },
  { source: "yahoo", pattern: /(^|\.)yahoo\.[a-z]{2,}(\.[a-z]{2,})?$/ },
  // Social - Messenger before Facebook, it lives on its own domains.
  { source: "messenger", domains: ["messenger.com"] },
  { source: "facebook", domains: ["facebook.com", "fb.com", "fb.me", "fb.watch"] },
  { source: "instagram", domains: ["instagram.com", "instagr.am"] },
  { source: "x", domains: ["x.com", "twitter.com", "t.co"] },
  { source: "tiktok", domains: ["tiktok.com"] },
  { source: "linkedin", domains: ["linkedin.com", "lnkd.in"] },
  { source: "reddit", domains: ["reddit.com", "redd.it"] },
  { source: "youtube", domains: ["youtube.com", "youtu.be"] },
  { source: "pinterest", pattern: /(^|\.)pinterest\.[a-z]{2,}(\.[a-z]{2,})?$/ },
  { source: "pinterest", domains: ["pin.it"] },
  { source: "snapchat", domains: ["snapchat.com"] },
  { source: "whatsapp", domains: ["whatsapp.com"] },
  { source: "telegram", domains: ["telegram.org", "t.me"] },
];

const IN_APP_RULES: { source: KnownTrafficSource; markers: RegExp }[] = [
  { source: "whatsapp", markers: /WhatsApp/i },
  { source: "messenger", markers: /FBAN\/Messenger|MessengerForiOS|Messenger(?:Lite)?\//i },
  { source: "instagram", markers: /Instagram/i },
  { source: "facebook", markers: /FBAN|FBAV|FB_IAB|FBIOS/i },
  { source: "tiktok", markers: /BytedanceWebview|musical_ly|TikTok/i },
  { source: "telegram", markers: /Telegram/i },
];

const MAX_SOURCE_LENGTH = 32;
const SAFE_SOURCE = /^[a-z0-9][a-z0-9._-]*$/;

export function normaliseSource(raw: string | null | undefined): TrafficSource | null {
  if (!raw) return null;

  const value = raw.trim().toLowerCase();
  if (!value || value.length > MAX_SOURCE_LENGTH) return null;
  if (!SAFE_SOURCE.test(value)) return null;

  return value;
}

function hostMatches(host: string, rule: RefererRule): boolean {
  if (rule.pattern?.test(host)) return true;
  return (rule.domains ?? []).some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function refererSource(referer: string | null, host: string | null): TrafficSource | null {
  if (!referer) return null;

  let refererHost: string;
  try {
    refererHost = new URL(referer).hostname.toLowerCase();
  } catch {
    // Malformed Referer - treat as absent rather than guessing.
    return null;
  }
  if (!refererHost) return null;

  // Moving around our own site is not an acquisition channel.
  if (host && refererHost === host.toLowerCase().split(":")[0]) return null;

  for (const rule of REFERER_RULES) {
    if (hostMatches(refererHost, rule)) return rule.source;
  }

  return null;
}

function inAppSource(userAgent: string | null): TrafficSource | null {
  if (!userAgent) return null;
  for (const rule of IN_APP_RULES) {
    if (rule.markers.test(userAgent)) return rule.source;
  }
  return null;
}

export type TrafficSignals = {
  searchParams: URLSearchParams;
  referer: string | null;
  userAgent: string | null;
  host: string | null;
};

/**
 * Resolves the traffic source, most explicit signal first:
 *
 *   1. `utm_source`      - the campaign said so
 *   2. `qr` / `social`   - legacy internal markers, kept for older links
 *   3. in-app user agent - only when a marker is actually present
 *   4. referrer          - external sites that still send one
 *   5. `direct`          - nothing usable
 */
export function resolveTrafficSource(signals: TrafficSignals): TrafficSource {
  const { searchParams, referer, userAgent, host } = signals;

  const utmSource = normaliseSource(searchParams.get(UTM_SOURCE_PARAM));
  if (utmSource) return utmSource;

  if (searchParams.get("qr") === "true") return "qr";
  if (searchParams.get("social") === "true") return "social";
  if (searchParams.has("gclid")) return "google";

  const inApp = inAppSource(userAgent);
  if (inApp) return inApp;

  const fromReferer = refererSource(referer, host);
  if (fromReferer) return fromReferer;

  return "direct";
}

/** Campaign metadata recorded alongside the source, when present. */
export function getTrafficMedium(req: NextRequest): string | null {
  return normaliseSource(req.nextUrl.searchParams.get(UTM_MEDIUM_PARAM));
}

export function getTrafficSource(req: NextRequest): TrafficSource {
  return resolveTrafficSource({
    searchParams: req.nextUrl.searchParams,
    referer: req.headers.get("referer"),
    userAgent: req.headers.get("user-agent"),
    host: req.nextUrl.host,
  });
}
