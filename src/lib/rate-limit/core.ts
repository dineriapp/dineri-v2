import "server-only";

import type { Redis } from "ioredis";

import { rateLimitRedis } from "@/lib/radis";
import type { RateLimitPolicy } from "./policies";

const HIT_SCRIPT = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
  return {current, tonumber(ARGV[1])}
end
local ttl = redis.call("PTTL", KEYS[1])
if ttl < 0 then
  -- Key exists without an expiry (should not happen; recover rather than leak).
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return {current, ttl}
`;

type RateLimitRedis = Redis & {
  dineriRateLimitHit(key: string, windowMs: number): Promise<[number, number]>;
};

const client = rateLimitRedis as RateLimitRedis;

if (typeof client.dineriRateLimitHit !== "function") {
  client.defineCommand("dineriRateLimitHit", { numberOfKeys: 1, lua: HIT_SCRIPT });
}

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: number;
  degraded: boolean;
};

function allowDegraded(policy: RateLimitPolicy): RateLimitResult {
  return {
    allowed: true,
    limit: policy.limit,
    remaining: policy.limit,
    retryAfterSeconds: policy.windowSeconds,
    resetAt: Math.ceil(Date.now() / 1000) + policy.windowSeconds,
    degraded: true,
  };
}

export async function consume(key: string, policy: RateLimitPolicy): Promise<RateLimitResult> {
  const windowMs = policy.windowSeconds * 1000;

  try {
    const [count, ttlMs] = await client.dineriRateLimitHit(key, windowMs);
    const retryAfterSeconds = Math.max(1, Math.ceil(ttlMs / 1000));

    return {
      allowed: count <= policy.limit,
      limit: policy.limit,
      remaining: Math.max(0, policy.limit - count),
      retryAfterSeconds,
      resetAt: Math.ceil(Date.now() / 1000) + retryAfterSeconds,
      degraded: false,
    };
  } catch (error) {
    console.error("Rate limit check failed, allowing request:", { key, error });
    return allowDegraded(policy);
  }
}
