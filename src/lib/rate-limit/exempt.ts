import "server-only";

const EXEMPT_PREFIXES = ["/api/cron/"];

const EXEMPT_PATTERNS = [/^\/api\/stripe\/[^/]+\/webhook\/?$/, /^\/api\/auth\/stripe\/webhook\/?$/];

export function isRateLimitExempt(pathname: string): boolean {
  if (EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  return EXEMPT_PATTERNS.some((pattern) => pattern.test(pathname));
}
