import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveRedisUrls } from "./urls";

describe("resolveRedisUrls", () => {
  it("shares one instance when only REDIS_URL is set", () => {
    const urls = resolveRedisUrls({ REDIS_URL: "redis://analytics:6379" });
    assert.deepEqual(urls, {
      analytics: "redis://analytics:6379",
      rateLimit: "redis://analytics:6379",
      separate: false,
    });
  });

  it("splits the limiter onto its own instance when RATE_LIMIT_REDIS_URL is set", () => {
    const urls = resolveRedisUrls({
      REDIS_URL: "redis://analytics:6379",
      RATE_LIMIT_REDIS_URL: "redis://limiter:6380",
    });
    assert.deepEqual(urls, {
      analytics: "redis://analytics:6379",
      rateLimit: "redis://limiter:6380",
      separate: true,
    });
  });

  it("treats a blank RATE_LIMIT_REDIS_URL as unset", () => {
    // `.env` files routinely carry `RATE_LIMIT_REDIS_URL=` with nothing after
    // it; that must not become a connection attempt to an empty string.
    for (const blank of ["", "   "]) {
      const urls = resolveRedisUrls({ REDIS_URL: "redis://a:6379", RATE_LIMIT_REDIS_URL: blank });
      assert.equal(urls.rateLimit, "redis://a:6379");
      assert.equal(urls.separate, false);
    }
  });

  it("does not report separate instances for the same URL written twice", () => {
    // One connection, not two, when both variables point at the same server.
    const urls = resolveRedisUrls({
      REDIS_URL: "redis://a:6379",
      RATE_LIMIT_REDIS_URL: "redis://a:6379",
    });
    assert.equal(urls.separate, false);
  });

  it("still requires REDIS_URL", () => {
    assert.throws(() => resolveRedisUrls({}), /REDIS_URL is not set/);
    assert.throws(
      () => resolveRedisUrls({ RATE_LIMIT_REDIS_URL: "redis://limiter:6380" }),
      /REDIS_URL is not set/,
    );
  });
});
