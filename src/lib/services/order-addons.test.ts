/**
 * Regression tests for add-on pricing on public orders (audit finding H-01).
 *
 * Run with:
 *   npx tsx --conditions=react-server --test src/lib/services/order-addons.test.ts
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { buildAddonIndex, resolveAddons } from "./order-addons";

/** A pizza with two paid add-ons, as the menu defines them. */
const MENU = buildAddonIndex([
  { label: "Extra truffle", price: 9.5 },
  { label: "Double protein", price: 6 },
]);

const BASE_PRICE = 20;

// ── The vulnerability itself ────────────────────────────────────────────────

test("H-01: an add-on declared free is still charged the menu price", () => {
  // The exact request from the finding: real item, real add-on labels, price 0.
  const r = resolveAddons(
    [
      { label: "Extra truffle", price: 0 },
      { label: "Double protein", price: 0 },
    ] as { label: string; price: number }[],
    MENU,
    "Pizza",
  );

  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.total, 15.5);
  assert.equal(BASE_PRICE + r.total, 35.5, "guest must be charged for what the kitchen makes");
});

test("H-01: an inflated add-on price is ignored too", () => {
  // The mirror case - the caller cannot overstate a price either.
  const r = resolveAddons([{ label: "Extra truffle", price: 9999 }] as never, MENU, "Pizza");
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.total, 9.5);
});

test("H-01: the caller's label is discarded in favour of the menu's", () => {
  // Closes the secondary finding: arbitrary text reaching kitchen tickets and
  // order emails.
  const r = resolveAddons(
    [{ label: "extra TRUFFLE  <script>alert(1)</script>" }],
    buildAddonIndex([{ label: "Extra truffle", price: 9.5 }]),
    "Pizza",
  );
  // That label does not match anything on the menu, so the order is refused
  // rather than carrying the injected text through.
  assert.equal(r.ok, false);
});

// ── Rejections ──────────────────────────────────────────────────────────────

test("an add-on the menu does not offer fails the order", () => {
  const r = resolveAddons([{ label: "Gold leaf" }], MENU, "Pizza");
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.match(r.error, /Gold leaf/);
  assert.match(r.error, /Pizza/);
});

test("an item with no add-ons rejects any add-on", () => {
  const r = resolveAddons([{ label: "Extra truffle" }], buildAddonIndex([]), "Salad");
  assert.equal(r.ok, false);
});

test("a null addons column is treated as no add-ons", () => {
  assert.equal(buildAddonIndex(null).size, 0);
  assert.equal(buildAddonIndex(undefined).size, 0);
  assert.equal(resolveAddons([{ label: "Anything" }], buildAddonIndex(null), "Soup").ok, false);
});

test("the same add-on twice is refused rather than double-charged", () => {
  const r = resolveAddons([{ label: "Extra truffle" }, { label: "extra truffle" }], MENU, "Pizza");
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.match(r.error, /more than once/);
});

// ── Tolerance for legitimate clients ────────────────────────────────────────

test("casing and surrounding whitespace do not fail a real order", () => {
  const r = resolveAddons([{ label: "  eXtRa TrUfFlE  " }], MENU, "Pizza");
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.total, 9.5);
  // …and the menu's own spelling is what gets stored and printed.
  assert.equal(r.addons[0].label, "Extra truffle");
});

test("an empty selection prices at zero", () => {
  const r = resolveAddons([], MENU, "Pizza");
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.deepEqual(r.addons, []);
  assert.equal(r.total, 0);
});

test("every menu add-on can be selected together", () => {
  const r = resolveAddons([{ label: "Double protein" }, { label: "Extra truffle" }], MENU, "Pizza");
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.addons.length, 2);
  assert.equal(r.total, 15.5);
});

test("prices stored as strings in jsonb are coerced to numbers", () => {
  const index = buildAddonIndex([{ label: "Cheese", price: "2.50" as unknown as number }]);
  const r = resolveAddons([{ label: "Cheese" }], index, "Burger");
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.total, 2.5);
  assert.equal(typeof r.addons[0].price, "number");
});
