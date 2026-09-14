/**
 * Prefetch traffic must be metered on its own counter, so speculative link
 * prefetching cannot exhaust the budget a real visitor needs to navigate.
 *
 * Run with:
 *   npx tsx --conditions=react-server --test src/lib/rate-limit/prefetch.test.ts
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { isPrefetchRequest, isServerActionRequest } from "./http";
import { globalKey, globalPrefetchKey } from "./keys";
import { RATE_LIMITS } from "./policies";

const req = (headers: Record<string, string> = {}) =>
  new Request("https://example.test/", { headers });

// ── Classification ──────────────────────────────────────────────────────────

test("an App Router prefetch is recognised", () => {
  assert.equal(isPrefetchRequest(req({ RSC: "1", "Next-Router-Prefetch": "1" })), true);
});

test("an RSC request from a real click is NOT a prefetch", () => {
  // A click sends RSC: 1 with a state tree, but no prefetch marker - it is a
  // genuine navigation and must cost a genuine navigation.
  assert.equal(
    isPrefetchRequest(req({ RSC: "1", "Next-Router-State-Tree": "%5B%22%22%5D" })),
    false,
  );
});

test("a plain document request is not a prefetch", () => {
  assert.equal(isPrefetchRequest(req({ accept: "text/html" })), false);
});

test("a server action is not a prefetch", () => {
  const action = req({ "Next-Action": "abc123" });
  assert.equal(isServerActionRequest(action), true);
  assert.equal(isPrefetchRequest(action), false);
});

test("only the exact value 1 counts", () => {
  assert.equal(isPrefetchRequest(req({ "Next-Router-Prefetch": "0" })), false);
  assert.equal(isPrefetchRequest(req({ "Next-Router-Prefetch": "true" })), false);
  assert.equal(isPrefetchRequest(req({ "Next-Router-Prefetch": "" })), false);
});

test("header matching is case-insensitive, as HTTP requires", () => {
  assert.equal(isPrefetchRequest(req({ "next-router-prefetch": "1" })), true);
  assert.equal(isPrefetchRequest(req({ "NEXT-ROUTER-PREFETCH": "1" })), true);
});

// ── Bucket separation ───────────────────────────────────────────────────────

test("prefetch and navigation use different Redis keys for the same client", () => {
  const ip = "203.0.113.7";
  assert.notEqual(globalKey(ip), globalPrefetchKey(ip));
  assert.equal(globalKey(ip), "ratelimit:global:203.0.113.7");
  assert.equal(globalPrefetchKey(ip), "ratelimit:global:prefetch:203.0.113.7");
});

test("different clients still get different prefetch buckets", () => {
  assert.notEqual(globalPrefetchKey("203.0.113.7"), globalPrefetchKey("203.0.113.8"));
});

// ── Sizing ──────────────────────────────────────────────────────────────────

test("forging the prefetch header moves you to another limit, never past one", () => {
  // The reason prefetch is a separate bucket rather than an exemption.
  assert.ok(RATE_LIMITS.globalPrefetch.limit > 0);
  assert.ok(Number.isFinite(RATE_LIMITS.globalPrefetch.limit));
});

test("the navigation budget covers a NAT'd office, not one person", () => {
  // ~3-4 requests per navigation, so 1200 is on the order of 300 navigations.
  assert.ok(
    RATE_LIMITS.global.limit >= 1000,
    "global limit too low for many users behind one egress IP",
  );
  assert.equal(RATE_LIMITS.global.windowSeconds, 60);
});

test("prefetch is the more generous of the two, since one page fans out", () => {
  assert.ok(RATE_LIMITS.globalPrefetch.limit > RATE_LIMITS.global.limit);
});
