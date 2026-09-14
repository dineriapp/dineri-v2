import { RestaurantOpeningHours } from "@/lib/types";

export const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

export const fmt = (min: number) => {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const DAY_MIN = 24 * 60;
const HOUR_MIN = 60;

// A one-hour service would leave no room to read blocks, so the ruler never
// gets narrower than this.
const MIN_RANGE_MIN = 4 * HOUR_MIN;

export type TimelineWindow = {
  /** Minutes from midnight of the selected day. `end` passes 1440 for overnight service. */
  startMin: number;
  endMin: number;
  rangeMin: number;
  /** Hour ticks, in minutes from midnight of the selected day. */
  ticks: number[];
  /** The restaurant has no opening hours set for this weekday. */
  closedDay: boolean;
};

/**
 * Opening hours for a given date, as minutes from that day's midnight.
 * A close time at or before the open time means service runs past midnight,
 * so the window extends into the next day - the same rule the reservation
 * availability service uses.
 */
export function getOpeningWindow(
  openingHours: RestaurantOpeningHours | null | undefined,
  date: Date,
): { start: number; end: number } | null {
  const schedule = openingHours?.[date.getDay()];
  if (!schedule?.isOpen || !schedule.openTime || !schedule.closeTime) return null;

  const start = toMin(schedule.openTime);
  let end = toMin(schedule.closeTime);
  if (end <= start) end += DAY_MIN;

  return { start, end };
}

/**
 * Late-night bookings on an overnight window ("01:00" against 18:00-02:00)
 * belong to the tail of the window, not to the morning before it opened.
 */
export function alignToWindow(minutes: number, window: { start: number; end: number }): number {
  return window.end > DAY_MIN && minutes < window.start ? minutes + DAY_MIN : minutes;
}

/**
 * The span the timeline should draw for one day: opening hours, widened to fit
 * any booking that sits outside them (a table moved past closing, or a booking
 * left behind by an opening-hours change) so nothing is ever hidden.
 *
 * Closed days fall back to a full day - there are no hours to scope to, and any
 * bookings still on the floor have to stay reachable.
 */
export function buildTimelineWindow({
  openingHours,
  date,
  bookingStartMinutes = [],
  slotMinutes,
}: {
  openingHours: RestaurantOpeningHours | null | undefined;
  date: Date;
  bookingStartMinutes?: number[];
  slotMinutes: number;
}): TimelineWindow {
  const opening = getOpeningWindow(openingHours, date);
  const base = opening ?? { start: 0, end: DAY_MIN };

  let start = base.start;
  let end = base.end;

  for (const raw of bookingStartMinutes) {
    const aligned = alignToWindow(raw, base);
    start = Math.min(start, aligned);
    end = Math.max(end, aligned + slotMinutes);
  }

  // Whole hours keep the ruler readable when opening times are off the hour.
  start = Math.max(0, Math.floor(start / HOUR_MIN) * HOUR_MIN);
  end = Math.ceil(end / HOUR_MIN) * HOUR_MIN;
  if (end - start < MIN_RANGE_MIN) end = start + MIN_RANGE_MIN;

  const ticks: number[] = [];
  for (let m = start; m <= end; m += HOUR_MIN) ticks.push(m);

  return { startMin: start, endMin: end, rangeMin: end - start, ticks, closedDay: !opening };
}
