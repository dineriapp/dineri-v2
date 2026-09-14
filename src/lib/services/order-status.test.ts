/**
 * Order workflow rules.
 *
 * Bulk status updates used to bypass the rules the single-order UI enforced,
 * so selecting a delivered or cancelled order and hitting "Mark preparing"
 * dragged it back into the kitchen. These lock the transition table down for
 * both paths.
 *
 * Run with:
 *   npx tsx --conditions=react-server --test src/lib/services/order-status.test.ts
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import type { OrderStatus } from "@/drizzle/schema";
import {
  canTransitionOrderStatus,
  isTerminalOrderStatus,
  nextOrderStatus,
  refuseOrderTransition,
} from "./order-status";

const ALL: OrderStatus[] = ["new", "confirmed", "preparing", "ready", "delivered", "cancelled"];

test("the documented valid transitions are allowed", () => {
  const valid: [OrderStatus, OrderStatus][] = [
    ["new", "confirmed"],
    ["confirmed", "preparing"],
    ["preparing", "ready"],
    ["ready", "delivered"],
    ["new", "cancelled"],
    ["confirmed", "cancelled"],
    ["preparing", "cancelled"],
    ["ready", "cancelled"],
  ];

  for (const [from, to] of valid) {
    assert.equal(canTransitionOrderStatus(from, to), true, `${from} -> ${to} should be allowed`);
  }
});

test("the documented invalid transitions are refused", () => {
  const invalid: [OrderStatus, OrderStatus][] = [
    ["preparing", "confirmed"],
    ["ready", "preparing"],
    ["delivered", "preparing"],
    ["delivered", "new"],
    ["cancelled", "confirmed"],
    ["cancelled", "new"],
  ];

  for (const [from, to] of invalid) {
    assert.equal(canTransitionOrderStatus(from, to), false, `${from} -> ${to} should be refused`);
  }
});

test("delivered and cancelled are frozen against every target", () => {
  for (const from of ["delivered", "cancelled"] as const) {
    assert.equal(isTerminalOrderStatus(from), true);

    for (const to of ALL) {
      const refusal = refuseOrderTransition(from, to);
      assert.ok(refusal, `${from} -> ${to} should be refused`);
      assert.equal(refusal.code, "terminal");
      assert.equal(refusal.clause, `already ${from}`);
    }
  }
});

test("nothing else is terminal", () => {
  for (const status of ["new", "confirmed", "preparing", "ready"] as const) {
    assert.equal(isTerminalOrderStatus(status), false);
  }
});

test("an order can always be cancelled until it is finished", () => {
  for (const from of ["new", "confirmed", "preparing", "ready"] as const) {
    assert.equal(canTransitionOrderStatus(from, "cancelled"), true);
  }
});

test("staying put is a no-op, not a refusal", () => {
  // A bulk "mark preparing" over a mixed batch shouldn't complain about the
  // orders that are already preparing.
  for (const status of ["new", "confirmed", "preparing", "ready"] as const) {
    assert.equal(canTransitionOrderStatus(status, status), true);
  }
});

test("jumping forward is allowed, so bulk actions can skip stages", () => {
  assert.equal(canTransitionOrderStatus("new", "preparing"), true);
  assert.equal(canTransitionOrderStatus("new", "delivered"), true);
  assert.equal(canTransitionOrderStatus("confirmed", "ready"), true);
});

test("every backward move is refused, at every distance", () => {
  const forward: OrderStatus[] = ["new", "confirmed", "preparing", "ready", "delivered"];

  for (let from = 0; from < forward.length; from++) {
    for (let to = 0; to < from; to++) {
      const refusal = refuseOrderTransition(forward[from], forward[to]);
      assert.ok(refusal, `${forward[from]} -> ${forward[to]} should be refused`);
      // delivered is terminal, so it refuses for that reason instead.
      assert.equal(refusal.code, forward[from] === "delivered" ? "terminal" : "backward");
    }
  }
});

test("a backward refusal explains which stage the order is already past", () => {
  const refusal = refuseOrderTransition("ready", "preparing");
  assert.ok(refusal);
  assert.equal(refusal.clause, "already past preparing");
  assert.match(refusal.message, /already ready/);
  assert.match(refusal.message, /can't move back to preparing/);
});

test("the reported bug: bulk 'mark preparing' over a mixed selection", () => {
  // Order 1 new, order 2 preparing, order 3 delivered, order 4 cancelled.
  const selection: OrderStatus[] = ["new", "preparing", "delivered", "cancelled"];
  const target: OrderStatus = "preparing";

  const results = selection.map((from) => refuseOrderTransition(from, target));

  assert.equal(results[0], null, "a new order can be moved to preparing");
  assert.equal(results[1], null, "an order already preparing stays put quietly");
  assert.equal(results[2]?.clause, "already delivered");
  assert.equal(results[3]?.clause, "already cancelled");

  const updated = results.filter((r) => r === null).length;
  assert.equal(updated, 2, "only two of the four should be written");
});

test("only a new order may be advanced to confirmed", () => {
  // The Stripe webhook confirms an order when payment lands. It has to leave
  // everything else alone, or a late delivery would drag an order being
  // prepared back to confirmed - or resurrect a cancelled one.
  assert.equal(canTransitionOrderStatus("new", "confirmed"), true);
  assert.equal(canTransitionOrderStatus("confirmed", "confirmed"), true, "no-op");

  for (const from of ["preparing", "ready", "delivered", "cancelled"] as const) {
    assert.equal(canTransitionOrderStatus(from, "confirmed"), false, `${from} -> confirmed`);
  }
});

test("nextOrderStatus walks the line and stops at the end", () => {
  assert.equal(nextOrderStatus("new"), "confirmed");
  assert.equal(nextOrderStatus("confirmed"), "preparing");
  assert.equal(nextOrderStatus("preparing"), "ready");
  assert.equal(nextOrderStatus("ready"), "delivered");
  assert.equal(nextOrderStatus("delivered"), null);
  assert.equal(nextOrderStatus("cancelled"), null);
});

test("whatever nextOrderStatus offers is a legal move", () => {
  for (const status of ALL) {
    const next = nextOrderStatus(status);
    if (next) {
      assert.equal(canTransitionOrderStatus(status, next), true, `${status} -> ${next}`);
    }
  }
});
