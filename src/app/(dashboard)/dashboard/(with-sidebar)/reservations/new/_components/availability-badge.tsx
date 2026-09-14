"use client";

import type {
  ReservationAvailabilityReason,
  ReservationAvailabilityResult,
} from "@/lib/services/reservation-availability";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Loader2,
  MapPin,
  Users,
  XCircle,
} from "lucide-react";

const HARD_STOP_REASONS: ReservationAvailabilityReason[] = [
  "EMERGENCY_STOP",
  "NOT_ACCEPTING_RESERVATIONS",
  "NO_TABLE_CAPACITY",
  "TABLE_CONFLICT",
  "RESTAURANT_NOT_FOUND",
];

type Props = {
  isReady: boolean;
  isLoading: boolean;
  result?: ReservationAvailabilityResult;
  error?: string | null;
};

export function AvailabilityBadge({ isReady, isLoading, result, error }: Props) {
  const tone = !isReady
    ? "idle"
    : isLoading
      ? "loading"
      : error
        ? "danger"
        : result?.available
          ? "success"
          : result && HARD_STOP_REASONS.includes(result.reason)
            ? "danger"
            : "warning";

  const shell: Record<typeof tone, string> = {
    idle: "border-white/10 bg-background",
    loading: "border-white/10 bg-background",
    success: "border-success/30 bg-success/10",
    warning: "border-warning/30 bg-warning/10",
    danger: "border-danger/30 bg-danger/10",
  };
  const iconColor: Record<typeof tone, string> = {
    idle: "text-muted-foreground",
    loading: "text-muted-foreground",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  };

  const Icon =
    tone === "loading"
      ? Loader2
      : tone === "success"
        ? CheckCircle2
        : tone === "warning"
          ? AlertTriangle
          : tone === "danger"
            ? XCircle
            : CalendarClock;

  const title =
    tone === "idle"
      ? "Pick a date, time and party size"
      : tone === "loading"
        ? "Checking availability…"
        : error
          ? "Couldn't check availability"
          : result?.available
            ? "Table available"
            : "Not available";

  const message =
    tone === "idle"
      ? "Availability is checked automatically as you fill the form."
      : tone === "loading"
        ? "One moment."
        : (error ?? result?.message ?? "");

  return (
    <div className={cn("rounded-xl border p-3 transition-colors", shell[tone])}>
      <div className="flex items-start gap-2.5">
        <Icon
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0",
            iconColor[tone],
            tone === "loading" && "animate-spin",
          )}
        />
        <div className="min-w-0">
          <div className="text-xs font-semibold">{title}</div>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{message}</p>
        </div>
      </div>

      {result?.available && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pl-6.5">
          {result.area && (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
              <MapPin className="h-2.5 w-2.5" /> {result.area.name}
            </span>
          )}
          {result.assignedTables.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-background px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              <Users className="h-2.5 w-2.5" /> {t.label} · {t.seats}p
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
