"use client";

import type {
  AssignedTable,
  ReservationAvailabilityReason,
  ReservationAvailabilityResult,
} from "@/lib/services/reservation-availability";
import type { AppearanceSettings } from "@/lib/types/appearnace";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Loader2,
  MapPin,
  Users,
  XCircle
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";


const HARD_STOP_REASONS: ReservationAvailabilityReason[] = [
  "EMERGENCY_STOP",
  "NOT_ACCEPTING_RESERVATIONS",
  "NO_TABLE_CAPACITY",
  "TABLE_CONFLICT",
  "RESTAURANT_NOT_FOUND",
];

type Tone = "idle" | "loading" | "success" | "warning" | "danger";

type Props = {
  settings: AppearanceSettings;
  sectionRadius: string;
  isReady: boolean;
  isLoading: boolean;
  result?: ReservationAvailabilityResult;
  error?: string | null;
};

export function ReservationAvailabilityCard({
  settings,
  sectionRadius,
  isReady,
  isLoading,
  result,
  error,
}: Props) {
  const tone: Tone = !isReady
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

  const stateKey = `${tone}:${result?.available}:${result && !result.available ? result.reason : ""}:${error ?? ""}`;

  return (
    <div
      className="rounded-3xl p-3"
      style={{
        background: settings.sectionBgColor,
        border: `1px solid ${settings.sectionBorderColor}`,
        borderRadius: sectionRadius,
      }}
    >
      <div className="relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={stateKey}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {tone === "idle" && (
              <StatusBody
                settings={settings}
                icon={CalendarClock}
                iconColor={settings.sectionItemTextColor}
                title="Pick a date, time, and party size"
                message="We'll check table availability for you automatically."
              />
            )}

            {tone === "loading" && (
              <StatusBody
                settings={settings}
                icon={Loader2}
                iconColor={settings.sectionItemTextColor}
                iconClassName="animate-spin"
                title="Checking availability…"
                message="Hang tight, this only takes a moment."
              />
            )}

            {tone === "success" && result?.available && (
              <>
                <StatusBody
                  settings={settings}
                  icon={CheckCircle2}
                  iconColor={settings.sectionItemHeadingColor}
                  title="Reservation available"
                  message={result.message}
                />
                {result.area && (
                  <div className="mt-3">
                    <Chip settings={settings} icon={MapPin} label={result.area.name} />
                  </div>
                )}
                <AssignedTablesList settings={settings} tables={result.assignedTables} />
              </>
            )}

            {(tone === "warning" || tone === "danger") && result && !result.available && (
              <>
                <StatusBody
                  settings={settings}
                  icon={tone === "danger" ? XCircle : AlertTriangle}
                  iconColor={settings.sectionItemHeadingColor}
                  title="Reservation not available"
                  message={result.message}
                />
              </>
            )}

            {tone === "danger" && error && !result && (
              <StatusBody
                settings={settings}
                icon={XCircle}
                iconColor={settings.sectionItemHeadingColor}
                title="Couldn't check availability"
                message={error}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

const StatusBody = ({
  settings,
  icon: Icon,
  iconColor,
  iconClassName,
  title,
  message,
}: {
  settings: AppearanceSettings;
  icon: React.ElementType;
  iconColor: string;
  iconClassName?: string;
  title: string;
  message: string;
}) => (
  <div className="flex items-start gap-3">
    <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconClassName ?? ""}`} style={{ color: iconColor }} />
    <div className="min-w-0">
      <div className="text-sm font-semibold" style={{ color: settings.sectionItemHeadingColor }}>
        {title}
      </div>
      <p className="mt-0.5 text-xs leading-relaxed" style={{ color: settings.sectionItemTextColor }}>
        {message}
      </p>
    </div>
  </div>
);

const AssignedTablesList = ({
  settings,
  tables,
}: {
  settings: AppearanceSettings;
  tables: AssignedTable[];
}) => {
  if (tables.length === 0) return null;
  const totalCapacity = tables.reduce((sum, t) => sum + t.seats, 0);

  return (
    <div
      className="mt-3 rounded-2xl p-3"
      style={{ background: settings.sectionInIconBgColor, border: `1px solid ${settings.sectionInIconBorderColor}` }}
    >
      <div
        className="font-jetbrains-mono text-[10px] uppercase tracking-wider"
        style={{ color: settings.sectionItemTextColor }}
      >
        {tables.length > 1 ? "Assigned tables" : "Assigned table"}
      </div>
      <ul className="mt-1.5 space-y-1">
        {tables.map((t) => (
          <li key={t.id} className="flex items-center gap-1.5 text-xs" style={{ color: settings.sectionInIconColor }}>
            <span style={{ color: settings.sectionItemTextColor }}>•</span>
            <span className="font-medium">{t.label}</span>
            <span style={{ color: settings.sectionItemTextColor }}>
              ({t.seats} seat{t.seats === 1 ? "" : "s"})
            </span>
          </li>
        ))}
      </ul>
      {tables.length > 1 && (
        <div
          className="mt-2 flex items-center gap-1.5 border-t pt-2 text-xs font-medium"
          style={{ borderColor: settings.sectionInIconBorderColor, color: settings.sectionInIconColor }}
        >
          <Users className="h-3 w-3" style={{ color: settings.sectionItemTextColor }} />
          Total capacity: {totalCapacity} seats
        </div>
      )}
    </div>
  );
};

const Chip = ({
  settings,
  icon: Icon,
  label,
}: {
  settings: AppearanceSettings;
  icon: React.ElementType;
  label: string;
}) => (
  <span
    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px]"
    style={{
      background: settings.sectionInIconBgColor,
      border: `1px solid ${settings.sectionInIconBorderColor}`,
      color: settings.sectionInIconColor,
    }}
  >
    <Icon className="h-3 w-3" style={{ color: settings.sectionItemTextColor }} /> {label}
  </span>
);
