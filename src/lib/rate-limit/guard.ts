import "server-only";

import { headers } from "next/headers";

import { consume, type RateLimitResult } from "./core";
import { resolveClientIp } from "./ip";
import { anonActionKey, apiKey, userActionKey } from "./keys";
import { RATE_LIMITS, type RateLimitPolicyName } from "./policies";

export type { RateLimitResult };

export async function limitApi(
  route: string,
  policy: RateLimitPolicyName,
  requestHeaders: Headers,
): Promise<RateLimitResult> {
  const { bucket } = resolveClientIp(requestHeaders);
  return consume(apiKey(bucket, route), RATE_LIMITS[policy]);
}

export async function limitAnonymousAction(
  action: string,
  policy: RateLimitPolicyName,
): Promise<RateLimitResult> {
  const { bucket } = resolveClientIp(await headers());
  return consume(anonActionKey(bucket, action), RATE_LIMITS[policy]);
}

export async function limitUserAction(
  action: string,
  userId: string,
  policy: RateLimitPolicyName,
): Promise<RateLimitResult> {
  return consume(userActionKey(userId, action), RATE_LIMITS[policy]);
}
