"use client";
import { Tip } from "@/components/ui/tip";
import { EventType } from "@/drizzle/types";
import { fmtDate } from "@/utils/global";
import {
  CalendarDays,
  Clock,
  Eye,
  EyeOff,
  Link as LinkIcon,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react";

const statusStyle: Record<string, string> = {
  live: "border-success/30 bg-success/10 text-success",
  draft: "border-warning/30 bg-warning/10 text-warning",
  ended: "border-white/10 bg-background text-muted-foreground",
};

const statusHint: Record<string, string> = {
  live: "Published - visible on your public page",
  draft: "Draft - not shown to guests yet",
  ended: "This event has already taken place",
};

export const EventCard = ({
  event,
  onEdit,
  onDelete,
  onToggle,
}: {
  event: EventType & { computedStatus: "live" | "draft" | "ended" };
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) => {
  const status = event.computedStatus;
  const isLive = status === "live";
  const eventDate = new Date(event.date);
  // Use date-fns to format with timezone? For display we can just use the stored date string.
  const day = eventDate.toLocaleDateString(undefined, { day: "2-digit" });
  const month = eventDate.toLocaleDateString(undefined, { month: "short" });
  const isEnded = status === "ended";

  return (
    <div className="dash-card group overflow-hidden rounded-2xl border border-white/5 bg-surface-1 transition hover:border-white/15">
      <div className="relative flex h-32 items-center justify-center overflow-hidden bg-linear-to-br from-white/15 via-emerald-500/5 to-transparent">
        <div className="text-center">
          <div className="font-inter-tight text-3xl font-bold leading-none tabular-nums">{day}</div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {month}
          </div>
        </div>
        <Tip label={statusHint[status]}>
          <span
            className={`absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${statusStyle[status]}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {status}
          </span>
        </Tip>
      </div>
      <div className="p-3 sm:p-4">
        <h4 className="font-inter-tight text-base font-semibold leading-tight">{event.title}</h4>
        {event.description ? (
          <Tip label={event.description}>
            <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">
              {event.description}
            </p>
          </Tip>
        ) : (
          <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">{event.description}</p>
        )}

        <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] text-muted-foreground">
          <Tip label={`Date - ${fmtDate(event.date)}`}>
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <CalendarDays className="h-3 w-3 shrink-0" />
              <span className="truncate">{fmtDate(event.date)}</span>
            </span>
          </Tip>
          <Tip label={`Starts at ${event.time}`}>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              {event.time}
            </span>
          </Tip>
          <Tip label={event.location ? `Location - ${event.location}` : "No location set"}>
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{event.location}</span>
            </span>
          </Tip>
          {event.buttonText && (
            <Tip label={`Button links to ${event.buttonLink}`}>
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <LinkIcon className="h-3 w-3 shrink-0" />
                <span className="truncate">{event.buttonText}</span>
              </span>
            </Tip>
          )}
        </div>

        <div className="mt-3 flex items-center justify-end gap-0.5">
          <Tip
            label={
              isEnded
                ? "Past events can't be shown or hidden"
                : isLive
                  ? "Hide from public page"
                  : "Show on public page"
            }
          >
            <span className={`inline-flex ${isEnded ? "cursor-not-allowed" : ""}`}>
              <button
                onClick={onToggle}
                disabled={isEnded}
                className={`rounded-md p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed sm:p-1.5 ${
                  isEnded ? "pointer-events-none" : ""
                }`}
                aria-label={isEnded ? "Cannot toggle past events" : "Toggle visibility"}
              >
                {isLive ? (
                  <Eye className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                ) : (
                  <EyeOff className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                )}
              </button>
            </span>
          </Tip>
          <Tip label="Edit event">
            <button
              onClick={onEdit}
              className="rounded-md p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground sm:p-1.5"
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </button>
          </Tip>
          <Tip label="Delete event">
            <button
              onClick={onDelete}
              className="rounded-md p-2 text-muted-foreground hover:bg-danger/10 hover:text-danger sm:p-1.5"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </button>
          </Tip>
        </div>
      </div>
    </div>
  );
};
