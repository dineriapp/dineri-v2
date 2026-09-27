import "server-only";

import { createHash } from "node:crypto";

import { consume } from "@/lib/rate-limit/core";
import { recipientKey } from "@/lib/rate-limit/keys";
import { RATE_LIMITS } from "@/lib/rate-limit/policies";

export type AuthEmailKind = "verify" | "reset";

export async function allowAuthEmail(kind: AuthEmailKind, email: string): Promise<boolean> {
  const hash = createHash("sha256").update(email.trim().toLowerCase()).digest("hex");

  const hourly = await consume(recipientKey(hash, kind, "1h"), RATE_LIMITS.authEmailHourly);
  if (!hourly.allowed) return false;

  const daily = await consume(recipientKey(hash, kind, "1d"), RATE_LIMITS.authEmailDaily);
  return daily.allowed;
}
