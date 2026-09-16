import "server-only";

import { venuePath, venueUrl } from "@/lib/venue-url";
import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_PURPOSE = "reservation-success-v1";

const TOKEN_BYTES = 16;

function signingKey(): Buffer {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is not set; cannot sign reservation links.");
  }
  return createHmac("sha256", secret).update(TOKEN_PURPOSE).digest();
}

export function reservationSuccessToken(reservationId: string): string {
  return createHmac("sha256", signingKey())
    .update(reservationId)
    .digest()
    .subarray(0, TOKEN_BYTES)
    .toString("base64url");
}

export function verifyReservationSuccessToken(
  reservationId: string,
  token: string | undefined | null,
): boolean {
  if (!token) return false;

  const expected = Buffer.from(reservationSuccessToken(reservationId));
  const provided = Buffer.from(token);

  if (expected.length !== provided.length) return false;
  return timingSafeEqual(expected, provided);
}

function reservationSuccessQuery(reservationId: string): string {
  return `?reservationId=${reservationId}&t=${reservationSuccessToken(reservationId)}`;
}

export function reservationSuccessPath(slug: string, reservationId: string): string {
  return `${venuePath(slug, "/reserve/success")}${reservationSuccessQuery(reservationId)}`;
}

export function reservationSuccessUrl(slug: string, reservationId: string): string {
  return `${venueUrl(slug, "/reserve/success")}${reservationSuccessQuery(reservationId)}`;
}
