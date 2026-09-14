import "server-only";

const DEFAULT_IP_HEADER = "x-forwarded-for";
const DEFAULT_PROXY_SECRET_HEADER = "x-proxy-auth";

export type ProxyTrustConfig = {
  trustProxy: boolean;
  trustedProxies: number;
  ipHeader: string;
  proxySecretHeader: string;
  proxySecret: string | null;
};

function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function parseDepth(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(parsed, 10);
}

export function proxyTrustConfigFromEnv(
  env: Record<string, string | undefined> = process.env,
): ProxyTrustConfig {
  return {
    trustProxy: parseBoolean(env.RATE_LIMIT_TRUST_PROXY),
    trustedProxies: parseDepth(env.RATE_LIMIT_TRUSTED_PROXIES),
    ipHeader: (env.RATE_LIMIT_IP_HEADER ?? DEFAULT_IP_HEADER).toLowerCase(),
    proxySecretHeader: (
      env.RATE_LIMIT_PROXY_SECRET_HEADER ?? DEFAULT_PROXY_SECRET_HEADER
    ).toLowerCase(),
    proxySecret: env.RATE_LIMIT_PROXY_SECRET?.trim() || null,
  };
}

const CONFIG = proxyTrustConfigFromEnv();

export const UNKNOWN_IP = "unknown";

export const UNTRUSTED_IP = "untrusted";

export const CLIENT_IP_HEADER = "x-dineri-client-ip";

export const UNTRUSTED_SENTINEL_IP = "192.0.2.0";

export function clientIpHeaderValue(resolved: ResolvedClientIp): string {
  return resolved.trusted && resolved.address ? resolved.address : UNTRUSTED_SENTINEL_IP;
}

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
const IPV6_CHARS = /^[0-9a-f:.]+$/i;

function normalizeAddress(raw: string): string | null {
  let value = raw.trim();
  if (!value) return null;

  if (value.startsWith("[")) {
    const end = value.indexOf("]");
    if (end === -1) return null;
    value = value.slice(1, end);
  } else if (value.split(":").length === 2) {
    value = value.slice(0, value.indexOf(":"));
  }

  if (!value) return null;

  const v4 = IPV4.exec(value);
  if (v4) {
    return v4.slice(1).every((octet) => Number(octet) <= 255) ? value : null;
  }

  if (value.includes(":") && IPV6_CHARS.test(value)) {
    return value.toLowerCase();
  }

  return null;
}

function toBucket(address: string): string {
  if (!address.includes(":")) return address;

  const [head, tail] = address.split("::");
  const headParts = head ? head.split(":") : [];

  if (tail === undefined) {
    return headParts.slice(0, 4).join(":");
  }

  const tailParts = tail ? tail.split(":") : [];
  const missing = Math.max(0, 8 - headParts.length - tailParts.length);
  const full = [...headParts, ...Array<string>(missing).fill("0"), ...tailParts];

  return full.slice(0, 4).join(":");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function cameThroughProxy(headers: Headers, config: ProxyTrustConfig): boolean {
  if (!config.proxySecret) return true;
  const presented = headers.get(config.proxySecretHeader);
  return presented !== null && safeEqual(presented, config.proxySecret);
}

export type ResolvedClientIp = {
  bucket: string;
  address: string | null;
  trusted: boolean;
};

const UNTRUSTED: ResolvedClientIp = {
  bucket: UNTRUSTED_IP,
  address: null,
  trusted: false,
};

export function resolveClientIpWith(headers: Headers, config: ProxyTrustConfig): ResolvedClientIp {
  if (!config.trustProxy || !cameThroughProxy(headers, config)) {
    return UNTRUSTED;
  }

  const { ipHeader, trustedProxies } = config;
  const forwarded = headers.get(ipHeader);

  if (forwarded) {
    const hops = forwarded
      .split(",")
      .map(normalizeAddress)
      .filter((entry): entry is string => entry !== null);

    if (hops.length >= trustedProxies) {
      const address = hops[hops.length - trustedProxies];
      if (address) {
        return { bucket: toBucket(address), address, trusted: true };
      }
    }
    return UNTRUSTED;
  }

  if (ipHeader !== "x-real-ip") {
    const realIp = normalizeAddress(headers.get("x-real-ip") ?? "");
    if (realIp) {
      return { bucket: toBucket(realIp), address: realIp, trusted: true };
    }
  }

  return { bucket: UNKNOWN_IP, address: null, trusted: true };
}

export function resolveClientIp(headers: Headers): ResolvedClientIp {
  return resolveClientIpWith(headers, CONFIG);
}

export function describeProxyTrust(config: ProxyTrustConfig = CONFIG): string {
  if (!config.trustProxy) {
    return (
      "[rate-limit] RATE_LIMIT_TRUST_PROXY is not enabled - forwarding headers are " +
      "ignored and every client shares one bucket. Set it to true (with " +
      "RATE_LIMIT_TRUSTED_PROXIES and ideally RATE_LIMIT_PROXY_SECRET) once the app " +
      "is behind a reverse proxy, or per-client limits cannot be enforced."
    );
  }

  const origin = config.proxySecret
    ? `verified via ${config.proxySecretHeader}`
    : "UNVERIFIED - set RATE_LIMIT_PROXY_SECRET so requests that bypass the proxy are rejected";

  return (
    `[rate-limit] Trusting ${config.ipHeader} at a depth of ` +
    `${config.trustedProxies} proxy hop(s); origin ${origin}.`
  );
}
