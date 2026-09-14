/**
 * Plan marketing copy vs the limits the product actually enforces.
 *
 * The hand-written copy had drifted: Growth advertised "5 restaurants" against
 * `venues: 1`, Starter claimed reviews it does not get, the analytics row said
 * 30 days / 12 months / unlimited against 7 / 90 / 365, and both paid tiers
 * offered a 14-day trial configured nowhere. These pin the derived strings to
 * `PLAN_LIMITS` so the next limit change can't quietly reopen the gap.
 *
 * Run with:
 *   npx tsx --test src/lib/stripe/plan-features.test.ts
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { PLAN_LIMITS } from "./limits";
import {
  formatLimit,
  PLAN_COMPARISON,
  PLAN_CTA,
  PLAN_FEATURES,
  planHeadlineFeatures,
} from "./plan-features";
import { PlanName } from "../types/plan-limits";

const PLANS: PlanName[] = ["starter", "growth", "scale"];

const rowFor = (label: string) => {
  for (const section of PLAN_COMPARISON) {
    const match = section.rows.find((r) => r.label === label);
    if (match) return match;
  }
  throw new Error(`no comparison row labelled "${label}"`);
};

test("no plan advertises a free trial", () => {
  // Nothing in the codebase configures `freeTrial` on a Stripe plan, so a
  // "Start 14-day trial" button promised something that could not happen.
  for (const plan of PLANS) {
    assert.ok(
      !/trial/i.test(PLAN_CTA[plan]),
      `${plan} CTA still offers a trial: "${PLAN_CTA[plan]}"`,
    );
  }
});

test("numeric comparison rows match the enforced limits", () => {
  const cases: [string, keyof typeof PLAN_LIMITS.starter][] = [
    ["Links", "links"],
    ["Menu categories", "menu"],
    ["Items per category", "items_per_category"],
    ["Gallery", "gallery"],
    ["FAQ", "faq"],
    ["Events", "events"],
    ["Popups", "popups"],
    ["QR codes", "qrCodes"],
    ["Venues", "venues"],
  ];

  for (const [label, key] of cases) {
    const row = rowFor(label);
    PLANS.forEach((plan, i) => {
      const limit = PLAN_LIMITS[plan][key] as number | "unlimited";
      // A zero allowance renders as a dash, not the string "0".
      const expected = limit === 0 ? false : formatLimit(limit);
      assert.equal(row.values[i], expected, `${label} / ${plan}`);
    });
  }
});

test("analytics history quotes the retention the server enforces", () => {
  const row = rowFor("Analytics history");
  PLANS.forEach((plan, i) => {
    assert.equal(row.values[i], `${PLAN_LIMITS[plan].analyticsRetention.value} days`, plan);
  });
  // The old table said 30 days / 12 months / Unlimited.
  assert.deepEqual(row.values, ["7 days", "90 days", "365 days"]);
});

test("boolean comparison rows match the enforced flags", () => {
  const cases: [string, keyof typeof PLAN_LIMITS.starter][] = [
    ["Success stories", "success_story"],
    ["Reviews", "reviews"],
    ["Custom domain", "customDomain"],
    ["Order system", "orderSystem"],
    ["Reservations", "reservations"],
    ["0% commission", "zeroCommission"],
    ["Automatic notifications", "automaticEmail"],
    ["White label email customization", "whiteLabelEmail"],
    ["SSO + role-based access", "ssoRoleBased"],
    ["Meta Pixel - track Facebook & Instagram ads", "metaPixel"],
  ];

  for (const [label, key] of cases) {
    const row = rowFor(label);
    PLANS.forEach((plan, i) => {
      assert.equal(row.values[i], PLAN_LIMITS[plan][key], `${label} / ${plan}`);
    });
  }
});

test("the rows that were provably wrong are now right", () => {
  // Starter gets automatic notifications; the table used to deny it.
  assert.equal(rowFor("Automatic notifications").values[0], true);
  // Starter has no popups at all, and Scale has 5 rather than unlimited.
  assert.deepEqual(rowFor("Popups").values, [false, "3", "5"]);
  // Starter does not get reviews, which a card used to promise.
  assert.equal(rowFor("Reviews").values[0], false);
  // Growth is a single venue, not five.
  assert.equal(rowFor("Venues").values[1], "1");
});

test("card features never contradict the venue limit", () => {
  for (const plan of PLANS) {
    const text = planHeadlineFeatures(plan).join(" ");
    const venues = PLAN_LIMITS[plan].venues;
    if (venues !== "unlimited") {
      assert.ok(
        !/unlimited venues/i.test(text),
        `${plan} claims unlimited venues but is capped at ${venues}`,
      );
    }
  }
});

test("card features are non-empty and deduplicated", () => {
  for (const plan of PLANS) {
    const features = PLAN_FEATURES[plan];
    assert.ok(features.length >= 4, `${plan} has too few bullets`);
    assert.ok(
      features.every((f) => f.trim().length > 0),
      `${plan} has a blank bullet`,
    );
    assert.equal(new Set(features).size, features.length, `${plan} repeats a bullet`);
  }
});

test("every comparison row covers all three plans", () => {
  for (const section of PLAN_COMPARISON) {
    assert.ok(section.rows.length > 0, `${section.section} is empty`);
    for (const row of section.rows) {
      assert.equal(row.values.length, 3, `${row.label} does not cover three plans`);
    }
  }
});

test("formatLimit renders unlimited as a word, not Infinity", () => {
  assert.equal(formatLimit("unlimited"), "Unlimited");
  assert.equal(formatLimit(10), "10");
  assert.equal(formatLimit(0), "0");
});

test("nothing claims the menu is translated", () => {
  // There is no translation layer for the guest-facing venue page or menu, so
  // neither a card nor a comparison row may imply one.
  const copy = [
    ...PLANS.flatMap((p) => planHeadlineFeatures(p)),
    ...PLAN_COMPARISON.flatMap((s) => s.rows.map((r) => r.label)),
  ].join(" ");
  assert.ok(!/language|translat/i.test(copy));
});
