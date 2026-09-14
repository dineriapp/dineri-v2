import "server-only";

import type { ReservationSettingType } from "@/app/(dashboard)/dashboard/(with-sidebar)/reservations/types";
import { DateTime } from "luxon";

export type HoldSettings = Pick<ReservationSettingType, "autoReleaseMinutes">;

export const DEFAULT_AUTO_RELEASE_MINUTES = 30;

const STRIPE_MIN_EXPIRY_MINUTES = 30;
const STRIPE_MAX_EXPIRY_MINUTES = 24 * 60;
const RELEASE_GRACE_MINUTES = 2;

export const HOLD_BOUNDS = {
  defaultMinutes: DEFAULT_AUTO_RELEASE_MINUTES,
  minMinutes: STRIPE_MIN_EXPIRY_MINUTES,
  maxMinutes: STRIPE_MAX_EXPIRY_MINUTES,
  graceMinutes: RELEASE_GRACE_MINUTES,
} as const;

export function resolveHoldMinutes(settings: HoldSettings): number {
  const configured = settings.autoReleaseMinutes ?? DEFAULT_AUTO_RELEASE_MINUTES;
  return Math.min(Math.max(configured, STRIPE_MIN_EXPIRY_MINUTES), STRIPE_MAX_EXPIRY_MINUTES);
}

export function checkoutExpiresAt(settings: HoldSettings, now: DateTime = DateTime.now()): number {
  const minutes = Math.min(resolveHoldMinutes(settings) + 1, STRIPE_MAX_EXPIRY_MINUTES);
  return Math.floor(now.plus({ minutes }).toSeconds());
}

export function holdReleaseCutoff(settings: HoldSettings, now: DateTime = DateTime.now()): Date {
  return now.minus({ minutes: resolveHoldMinutes(settings) + RELEASE_GRACE_MINUTES }).toJSDate();
}
