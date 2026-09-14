import assert from "node:assert/strict";
import { test } from "node:test";
import { DateTime } from "luxon";
import {
  EVENT_MIN_LEAD_HOURS,
  filterPublicEvents,
  getEventLeadTimeError,
  hasEventPassed,
  isEventPublic,
} from "./event-visibility";

const TZ = "Europe/London";

const at = (hoursFromNow: number) => {
  const dt = DateTime.now().setZone(TZ).plus({ hours: hoursFromNow });
  return { date: dt.toFormat("yyyy-MM-dd"), time: dt.toFormat("HH:mm") };
};

test("an event whose start has gone by counts as passed", () => {
  assert.equal(hasEventPassed(at(-1), TZ), true);
  assert.equal(hasEventPassed(at(1), TZ), false);
});

test("a malformed schedule is left visible rather than silently hidden", () => {
  assert.equal(hasEventPassed({ date: "not-a-date", time: "19:00" }, TZ), false);
});

test("single-digit hours parse", () => {
  const dt = DateTime.now().setZone(TZ).minus({ days: 1 });
  assert.equal(hasEventPassed({ date: dt.toFormat("yyyy-MM-dd"), time: "9:30" }, TZ), true);
});

test("public means both live and upcoming", () => {
  assert.equal(isEventPublic({ ...at(5), active: true }, TZ), true);
  assert.equal(isEventPublic({ ...at(5), active: false }, TZ), false);
  assert.equal(isEventPublic({ ...at(-5), active: true }, TZ), false);
});

test("filterPublicEvents drops hidden and past events", () => {
  const events = [
    { id: "upcoming", ...at(48), active: true },
    { id: "hidden", ...at(48), active: false },
    { id: "past", ...at(-48), active: true },
  ];
  assert.deepEqual(
    filterPublicEvents(events, TZ).map((e) => e.id),
    ["upcoming"],
  );
});

test("the lead-time rule rejects anything under the minimum", () => {
  assert.equal(getEventLeadTimeError(at(EVENT_MIN_LEAD_HOURS + 1), TZ), null);
  assert.notEqual(getEventLeadTimeError(at(EVENT_MIN_LEAD_HOURS - 1), TZ), null);
  assert.notEqual(getEventLeadTimeError(at(-1), TZ), null);
});

test("the venue timezone decides, not the reader's", () => {
  // 23:00 in Auckland is still the previous afternoon in London.
  const auckland = DateTime.now().setZone("Pacific/Auckland");
  const schedule = { date: auckland.toFormat("yyyy-MM-dd"), time: "23:59" };
  assert.equal(hasEventPassed(schedule, "Pacific/Auckland"), false);
});
