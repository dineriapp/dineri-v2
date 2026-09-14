import { DateTime } from "luxon";

export const DEFAULT_EVENT_TIMEZONE = "Europe/London";

export const EVENT_MIN_LEAD_HOURS = 2;

export type EventSchedule = {
  date: string;
  time: string;
};

export function eventDateTime(event: EventSchedule, timezone: string): DateTime | null {
  const dt = DateTime.fromFormat(
    `${event.date} ${event.time.padStart(5, "0")}`,
    "yyyy-MM-dd HH:mm",
    { zone: timezone || DEFAULT_EVENT_TIMEZONE },
  );
  return dt.isValid ? dt : null;
}

export function hasEventPassed(event: EventSchedule, timezone: string): boolean {
  const dt = eventDateTime(event, timezone);
  if (!dt) return false;
  return dt <= DateTime.now().setZone(timezone || DEFAULT_EVENT_TIMEZONE);
}

export function isEventPublic<T extends EventSchedule & { active: boolean }>(
  event: T,
  timezone: string,
): boolean {
  return event.active && !hasEventPassed(event, timezone);
}

export function filterPublicEvents<T extends EventSchedule & { active: boolean }>(
  events: T[],
  timezone: string,
): T[] {
  return events.filter((event) => isEventPublic(event, timezone));
}

export function getEventLeadTimeError(event: EventSchedule, timezone: string): string | null {
  const zone = timezone || DEFAULT_EVENT_TIMEZONE;
  const dt = eventDateTime(event, zone);
  if (!dt) return "Invalid date or time";

  const earliest = DateTime.now().setZone(zone).plus({ hours: EVENT_MIN_LEAD_HOURS });
  if (dt < earliest) {
    return `Events must start at least ${EVENT_MIN_LEAD_HOURS} hours from now (earliest ${earliest.toFormat("dd LLL yyyy, HH:mm")}).`;
  }
  return null;
}

export function earliestEventDate(timezone: string): string {
  return DateTime.now()
    .setZone(timezone || DEFAULT_EVENT_TIMEZONE)
    .plus({ hours: EVENT_MIN_LEAD_HOURS })
    .toFormat("yyyy-MM-dd");
}
