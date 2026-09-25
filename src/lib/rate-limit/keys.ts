import "server-only";

const PREFIX = "ratelimit";

function safe(part: string): string {
  return part.replace(/[\s:]+/g, "_").slice(0, 128) || "unknown";
}

export function globalKey(ip: string): string {
  return `${PREFIX}:global:${safe(ip)}`;
}

export function globalPrefetchKey(ip: string): string {
  return `${PREFIX}:global:prefetch:${safe(ip)}`;
}

export function apiKey(ip: string, route: string): string {
  return `${PREFIX}:api:${safe(ip)}:${safe(route)}`;
}

export function userActionKey(userId: string, action: string): string {
  return `${PREFIX}:action:${safe(userId)}:${safe(action)}`;
}

export function recipientKey(recipientHash: string, kind: string, window: string): string {
  return `${PREFIX}:recipient:${safe(kind)}:${safe(window)}:${safe(recipientHash)}`;
}

export function anonActionKey(ip: string, action: string): string {
  return `${PREFIX}:action:ip:${safe(ip)}:${safe(action)}`;
}
