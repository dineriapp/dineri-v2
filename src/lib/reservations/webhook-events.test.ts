import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const STRIPE_SETTINGS_DIR = "src/app/(dashboard)/dashboard/(with-sidebar)/settings/stripe";

/** Follows the constant rather than assuming which file in that folder holds it. */
const SETTINGS_SOURCE = ["schema.ts", "actions.ts"]
  .map((f) => readFileSync(`${STRIPE_SETTINGS_DIR}/${f}`, "utf8"))
  .join("\n");

const ACTIONS_SOURCE = SETTINGS_SOURCE;

const ROUTE_SOURCE = readFileSync("src/app/api/stripe/[restaurantId]/webhook/route.ts", "utf8");

function subscribedEvents(): string[] {
  const block = ACTIONS_SOURCE.match(/STRIPE_WEBHOOK_EVENTS = \[([\s\S]*?)\] as const;/);
  assert.ok(block, "could not find STRIPE_WEBHOOK_EVENTS in the Stripe settings action");
  return [...block[1].matchAll(/"([\w.]+)"/g)].map((m) => m[1]);
}

function handledEvents(): string[] {
  return [...ROUTE_SOURCE.matchAll(/case "([\w]+\.[\w.]+)":/g)].map((m) => m[1]);
}

describe("Stripe webhook subscription", () => {
  it("subscribes to every event the route handles", () => {
    const subscribed = new Set(subscribedEvents());
    const missing = handledEvents().filter((e) => !subscribed.has(e));

    assert.deepEqual(
      missing,
      [],
      `handled but never subscribed, so Stripe will not deliver them: ${missing.join(", ")}`,
    );
  });

  it("does not subscribe to events nothing handles", () => {
    const handled = new Set(handledEvents());
    const unhandled = subscribedEvents().filter((e) => !handled.has(e));

    assert.deepEqual(
      unhandled,
      [],
      `subscribed but unhandled, so the endpoint takes pointless traffic: ${unhandled.join(", ")}`,
    );
  });

  it("covers the payment lifecycle the reservation flow depends on", () => {
    const subscribed = subscribedEvents();
    for (const required of [
      "checkout.session.completed",
      "checkout.session.expired",
      "charge.refunded",
    ]) {
      assert.ok(subscribed.includes(required), `${required} must be subscribed`);
    }
  });

  it("creates and repairs endpoints from the same list", () => {
    const uses = ACTIONS_SOURCE.match(/enabled_events: \[\.\.\.STRIPE_WEBHOOK_EVENTS\]/g) ?? [];
    assert.equal(uses.length, 2, "both create and update should spread STRIPE_WEBHOOK_EVENTS");
  });
});
