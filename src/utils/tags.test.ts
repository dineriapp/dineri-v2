/**
 * Menu item dietary/allergy tags.
 *
 * The keys are stored in a jsonb column that predates this list, so the two
 * things worth locking in are that the original keys still resolve and that a
 * malformed or unknown value can never reach a guest's menu.
 *
 * Run with:
 *   npx tsx --test src/utils/tags.test.ts
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { resolveTags, TAG_KEYS, TAGS, tagsInGroup, toTagKeys } from "./tags";

test("keys are unique", () => {
  assert.equal(new Set(TAG_KEYS).size, TAG_KEYS.length);
});

test("the keys that were already stored still resolve", () => {
  // Every row in the database used one of these before the list grew.
  assert.deepEqual(
    resolveTags(["featured", "spicy"]).map((t) => t.key),
    ["featured", "spicy"],
  );
});

test("tags come back in canonical order, not click order", () => {
  const clicked = ["alcohol", "featured", "vegan"];
  assert.deepEqual(
    resolveTags(clicked).map((t) => t.key),
    ["featured", "vegan", "alcohol"],
  );
});

test("unknown keys are dropped rather than rendered", () => {
  assert.deepEqual(
    resolveTags(["vegan", "not_a_tag", ""]).map((t) => t.key),
    ["vegan"],
  );
  assert.deepEqual(resolveTags(["totally-unknown"]), []);
});

test("empty and missing values are not an error", () => {
  assert.deepEqual(resolveTags([]), []);
  assert.deepEqual(resolveTags(null), []);
  assert.deepEqual(resolveTags(undefined), []);
});

test("a malformed jsonb scalar does not become a set of characters", () => {
  // `tags` is jsonb: a bad write can leave a string where an array belongs.
  // Without the Array.isArray guard `new Set("egg")` matches nothing but
  // `"vegan,egg"` would still be walked character by character.
  const scalar = "egg" as unknown as string[];
  assert.deepEqual(resolveTags(scalar), []);
  assert.deepEqual(resolveTags(42 as unknown as string[]), []);
  assert.deepEqual(resolveTags({} as unknown as string[]), []);
});

test("allergens are worded as a warning, diets are not", () => {
  for (const tag of tagsInGroup("allergen")) {
    assert.ok(
      tag.publicLabel.startsWith("Contains "),
      `${tag.key} should read as a warning, got "${tag.publicLabel}"`,
    );
  }
  for (const tag of [...tagsInGroup("diet"), ...tagsInGroup("highlight")]) {
    assert.ok(!tag.publicLabel.startsWith("Contains "), `${tag.key} is a claim, not a warning`);
  }
});

test("every tag is in exactly one group and the groups cover the list", () => {
  const grouped = [...tagsInGroup("highlight"), ...tagsInGroup("diet"), ...tagsInGroup("allergen")];
  assert.equal(grouped.length, TAGS.length, "a tag is missing from the picker");
});

test("the allergens a guest is most likely to ask about are covered", () => {
  const allergens = tagsInGroup("allergen").map((t) => t.key);
  for (const key of ["nuts", "dairy", "gluten", "egg", "soy", "shellfish", "fish"]) {
    assert.ok(allergens.includes(key as (typeof allergens)[number]), `missing ${key}`);
  }
});

test("toTagKeys narrows a stored value for the editor", () => {
  assert.deepEqual(toTagKeys(["vegan", "gone_away", "nuts"]), ["vegan", "nuts"]);
  assert.deepEqual(toTagKeys(null), []);
  // What the form feeds back must always satisfy the schema's enum.
  for (const key of toTagKeys(["featured", "junk"])) {
    assert.ok(TAG_KEYS.includes(key));
  }
});
