/**
 * Reservation booking policies.
 *
 * The column is nullable and nothing was backfilled, so the load-bearing
 * behaviour is that a venue which has never touched these still gets all three
 * with sensible copy - and that a partially written row fills its gaps.
 *
 * Run with:
 *   npx tsx --test src/lib/types/reservation-policy.test.ts
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  defaultCancellationContent,
  RESERVATION_POLICY_IDS,
  RESERVATION_POLICY_TITLE,
  resolveReservationPolicies,
  visibleReservationPolicies,
} from "./reservation-policy";

test("a restaurant that has never saved gets all three, enabled", () => {
  const policies = resolveReservationPolicies(null, 24);
  assert.deepEqual(
    policies.map((p) => p.id),
    [...RESERVATION_POLICY_IDS],
  );
  assert.ok(policies.every((p) => p.enabled));
  assert.ok(policies.every((p) => p.content.trim().length > 0));
});

test("undefined and a non-array are treated as unsaved", () => {
  for (const bad of [undefined, "[]", 42, {}]) {
    const policies = resolveReservationPolicies(bad, 24);
    assert.equal(policies.length, 3, `failed for ${JSON.stringify(bad)}`);
    assert.ok(policies.every((p) => p.enabled));
  }
});

test("saved values win over defaults", () => {
  const policies = resolveReservationPolicies(
    [{ id: "no-show-policy", enabled: false, content: "Our own wording." }],
    24,
  );
  const noShow = policies.find((p) => p.id === "no-show-policy")!;
  assert.equal(noShow.enabled, false);
  assert.equal(noShow.content, "Our own wording.");

  // The two it did not mention still come back with defaults.
  const dining = policies.find((p) => p.id === "dining-policy")!;
  assert.equal(dining.enabled, true);
  assert.ok(dining.content.length > 0);
});

test("a partially written entry fills only its missing fields", () => {
  const [cancellation] = resolveReservationPolicies([{ id: "cancellation-policy" }], 24);
  assert.equal(cancellation.enabled, true, "missing enabled defaults to shown");
  assert.equal(cancellation.content, defaultCancellationContent(24));
});

test("an emptied box stays empty rather than snapping back to the default", () => {
  // Clearing the text is a deliberate act; it must not be undone on reload.
  const [cancellation] = resolveReservationPolicies(
    [{ id: "cancellation-policy", enabled: true, content: "" }],
    24,
  );
  assert.equal(cancellation.content, "");
  // ...but an empty policy is not shown to guests.
  assert.equal(visibleReservationPolicies([cancellation]).length, 0);
});

test("unknown ids in a stored row are ignored", () => {
  const policies = resolveReservationPolicies(
    [{ id: "refund-policy", enabled: false, content: "gone" }, null, "nonsense"],
    24,
  );
  assert.equal(policies.length, 3);
  assert.deepEqual(
    policies.map((p) => p.id),
    [...RESERVATION_POLICY_IDS],
  );
  assert.ok(policies.every((p) => p.enabled));
});

test("cancellation copy follows the venue's own window", () => {
  const twelve = defaultCancellationContent(12);
  assert.ok(twelve.includes("12 hours"), "should quote the configured window");
  assert.ok(twelve.includes("6 hours"), "half the window for the partial tier");

  // Singular reads correctly, and half never drops below one hour.
  const one = defaultCancellationContent(1);
  assert.ok(one.includes("1 hour before"), one);
  assert.ok(!one.includes("1 hours"));

  // A nonsense window must not produce "NaN hours" on a live page.
  for (const bad of [NaN, Infinity, -5]) {
    const text = defaultCancellationContent(bad);
    assert.ok(!/NaN|Infinity|-\d/.test(text), `bad window ${bad} produced: ${text}`);
  }
});

test("only enabled policies with content reach guests", () => {
  const policies = resolveReservationPolicies(
    [
      { id: "cancellation-policy", enabled: true, content: "Keep me." },
      { id: "no-show-policy", enabled: false, content: "Hidden." },
      { id: "dining-policy", enabled: true, content: "   " },
    ],
    24,
  );
  const visible = visibleReservationPolicies(policies);
  assert.deepEqual(
    visible.map((p) => p.id),
    ["cancellation-policy"],
  );
});

test("every id has a title", () => {
  for (const id of RESERVATION_POLICY_IDS) {
    assert.ok(RESERVATION_POLICY_TITLE[id]?.length > 0, `no title for ${id}`);
  }
});
