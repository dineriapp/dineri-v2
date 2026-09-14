/**
 * Once-per-session popup memory.
 *
 * Popups used to reappear on every refresh of the venue page and the menu
 * page, because the renderer kept "already shown" in component state and a
 * refresh remounts it. These lock in the storage behaviour that replaces it.
 *
 * Run with:
 *   npx tsx --test src/lib/services/popup-session.test.ts
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  markPopupSeen,
  POPUP_SEEN_KEY,
  readSeenPopups,
  type PopupSeenStore,
} from "./popup-session";

/** Stands in for sessionStorage; `fail` makes every access throw. */
function fakeStore(initial: Record<string, string> = {}, fail = false): PopupSeenStore {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => {
      if (fail) throw new Error("storage denied");
      return data.get(key) ?? null;
    },
    setItem: (key, value) => {
      if (fail) throw new Error("quota exceeded");
      data.set(key, value);
    },
  };
}

test("a fresh session remembers nothing", () => {
  assert.deepEqual([...readSeenPopups(fakeStore())], []);
});

test("the reported bug: a popup shown once is not shown again", () => {
  const store = fakeStore();

  // First visit - nothing seen, so the popup qualifies.
  assert.equal(readSeenPopups(store).has("promo-1"), false);
  markPopupSeen("promo-1", store);

  // Refresh - the renderer reads the same session store and skips it.
  assert.equal(readSeenPopups(store).has("promo-1"), true);
});

test("marking one popup does not suppress the others", () => {
  const store = fakeStore();
  markPopupSeen("promo-1", store);

  const seen = readSeenPopups(store);
  assert.equal(seen.has("promo-1"), true);
  assert.equal(seen.has("promo-2"), false, "a second popup is still owed a viewing");
});

test("the venue page and the menu page each get their own popup", () => {
  // They render different popups (onPage differs), so seeing one must not
  // consume the other.
  const store = fakeStore();
  markPopupSeen("restaurant-popup", store);

  assert.equal(readSeenPopups(store).has("menu-popup"), false);
  markPopupSeen("menu-popup", store);

  assert.deepEqual([...readSeenPopups(store)].sort(), ["menu-popup", "restaurant-popup"]);
});

test("marking is idempotent and accumulates", () => {
  const store = fakeStore();
  markPopupSeen("a", store);
  markPopupSeen("a", store);
  markPopupSeen("b", store);

  assert.deepEqual([...readSeenPopups(store)].sort(), ["a", "b"]);
});

test("state is written under one predictable key", () => {
  const store = fakeStore();
  markPopupSeen("a", store);
  assert.equal(store.getItem(POPUP_SEEN_KEY), JSON.stringify(["a"]));
});

test("corrupt or unexpected stored values are ignored, not thrown on", () => {
  assert.deepEqual([...readSeenPopups(fakeStore({ [POPUP_SEEN_KEY]: "not json" }))], []);
  assert.deepEqual([...readSeenPopups(fakeStore({ [POPUP_SEEN_KEY]: '"a string"' }))], []);
  assert.deepEqual([...readSeenPopups(fakeStore({ [POPUP_SEEN_KEY]: "{}" }))], []);
  assert.deepEqual([...readSeenPopups(fakeStore({ [POPUP_SEEN_KEY]: "null" }))], []);
  // A malformed array still yields the usable ids.
  assert.deepEqual(
    [...readSeenPopups(fakeStore({ [POPUP_SEEN_KEY]: '["a",1,null,"b"]' }))],
    ["a", "b"],
  );
});

test("blocked storage degrades to the old behaviour instead of crashing", () => {
  // Private browsing, denied cookies, exhausted quota. The visitor sees the
  // popup again - annoying, but the page still works.
  const denied = fakeStore({}, true);

  assert.doesNotThrow(() => markPopupSeen("a", denied));
  assert.deepEqual([...readSeenPopups(denied)], []);
});

test("no store at all - server rendering - reports nothing seen", () => {
  assert.deepEqual([...readSeenPopups(null)], []);
  assert.doesNotThrow(() => markPopupSeen("a", null));
});

test("an empty id is not recorded", () => {
  const store = fakeStore();
  markPopupSeen("", store);
  assert.deepEqual([...readSeenPopups(store)], []);
});
