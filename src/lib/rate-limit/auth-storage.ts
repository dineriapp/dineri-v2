import "server-only";

import type { BetterAuthOptions } from "better-auth";

import { consume } from "./core";

type BetterAuthRateLimitStorage = NonNullable<
  NonNullable<BetterAuthOptions["rateLimit"]>["customStorage"]
>;

const PREFIX = "ratelimit:auth";

export const authRateLimitStorage: BetterAuthRateLimitStorage = {
  get: async () => null,
  set: async () => {},
  consume: async (key, rule) => {
    const result = await consume(`${PREFIX}:${key}`, {
      limit: rule.max,
      windowSeconds: rule.window,
    });
    return {
      allowed: result.allowed,
      retryAfter: result.allowed ? null : result.retryAfterSeconds,
    };
  },
};
