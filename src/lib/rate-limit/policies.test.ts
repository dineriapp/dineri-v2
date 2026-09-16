import assert from "node:assert/strict";
import { test } from "node:test";

import { anonActionKey } from "./keys";
import { RATE_LIMITS } from "./policies";

test("H-03: the reservation policies exist and are bounded", () => {
  assert.ok(RATE_LIMITS.publicReservation, "publicReservation policy is missing");
  assert.ok(RATE_LIMITS.publicAvailability, "publicAvailability policy is missing");

  for (const name of ["publicReservation", "publicAvailability"] as const) {
    const p = RATE_LIMITS[name];
    assert.ok(Number.isFinite(p.limit) && p.limit > 0, `${name} limit must be positive`);
    assert.ok(Number.isFinite(p.windowSeconds) && p.windowSeconds > 0);
  }
});

test("H-03: creating a booking is far tighter than the global ceiling", () => {
  assert.ok(
    RATE_LIMITS.publicReservation.limit < RATE_LIMITS.global.limit / 10,
    "reservation creation must not be anywhere near the global ceiling",
  );
  assert.equal(RATE_LIMITS.publicReservation.limit, 10);
  assert.equal(RATE_LIMITS.publicReservation.windowSeconds, 60);
});

test("H-03: creating is tighter than checking, which is tighter than ordering", () => {
  // Booking takes inventory, so it is the most restricted. Availability is
  // called repeatedly as the guest fills the form, so it gets more headroom -
  // but it is the most expensive query in the app, so it stays bounded.
  assert.ok(
    RATE_LIMITS.publicReservation.limit < RATE_LIMITS.publicAvailability.limit,
    "a guest checks availability more often than they book",
  );
  assert.equal(RATE_LIMITS.publicAvailability.limit, 60);
  assert.ok(
    RATE_LIMITS.publicReservation.limit < RATE_LIMITS.publicOrder.limit,
    "a reservation holds tables; an order does not",
  );
});

test("H-03: the two reservation actions meter on separate buckets", () => {
  // Sharing a bucket would let availability polling exhaust the booking
  // budget, locking a genuine guest out of completing their reservation.
  const ip = "203.0.113.7";
  const create = anonActionKey(ip, "create-reservation");
  const check = anonActionKey(ip, "check-reservation-availability");

  assert.notEqual(create, check);
  assert.equal(create, "ratelimit:action:ip:203.0.113.7:create-reservation");
  assert.equal(check, "ratelimit:action:ip:203.0.113.7:check-reservation-availability");
});

test("H-03: reservation buckets are per client, not shared", () => {
  assert.notEqual(
    anonActionKey("203.0.113.7", "create-reservation"),
    anonActionKey("203.0.113.8", "create-reservation"),
  );
});

test("every named policy is a sane, finite window", () => {
  for (const [name, policy] of Object.entries(RATE_LIMITS)) {
    assert.ok(Number.isInteger(policy.limit) && policy.limit > 0, `${name}: bad limit`);
    assert.ok(
      Number.isInteger(policy.windowSeconds) && policy.windowSeconds > 0,
      `${name}: bad window`,
    );
  }
});
