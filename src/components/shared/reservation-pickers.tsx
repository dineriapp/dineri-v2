"use client";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, formatTimeLabel, from24Hour, type Meridiem } from "@/lib/utils";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";

const SLOT_MINUTES = 15;

const CLOCK_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hour12 = Math.floor(i / 4) + 1;
  const minute = (i % 4) * SLOT_MINUTES;
  return { hour12, minute, label: `${hour12}:${String(minute).padStart(2, "0")}` };
});

function to24Hour(hour12: number, minute: number, meridiem: Meridiem): string {
  const h = meridiem === "AM" ? (hour12 === 12 ? 0 : hour12) : hour12 === 12 ? 12 : hour12 + 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

// Both live in lib so pages that only need the label don't pull the calendar
// and popover in with it. Re-exported here because callers already import it
// from this module.
export { formatTimeLabel } from "@/lib/utils";

type TriggerProps = {
  className?: string;
  style?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
  placeholderStyle?: React.CSSProperties;
  placeholderClassName?: string;
};

export function ReservationDatePicker({
  value,
  onChange,
  placeholder = "Select a date",
  disablePast = true,
  className,
  style,
  labelStyle,
  placeholderStyle,
  placeholderClassName,
}: TriggerProps & {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disablePast?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(`${value}T00:00:00`) : undefined;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={className} style={style}>
          <span
            className={selected ? undefined : placeholderClassName}
            style={selected ? labelStyle : placeholderStyle}
          >
            {selected ? format(selected, "EEE, MMM d, yyyy") : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          disabled={disablePast ? (d) => d < todayStart : undefined}
          onSelect={(d) => {
            if (d) {
              onChange(format(d, "yyyy-MM-dd"));
              setOpen(false);
            }
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export function ReservationTimePicker({
  value,
  onChange,
  placeholder = "Select a time",
  className,
  style,
  labelStyle,
  placeholderStyle,
  placeholderClassName,
}: TriggerProps & {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = from24Hour(value);

  const [meridiem, setMeridiem] = useState<Meridiem>(selected?.meridiem ?? "AM");
  useEffect(() => {
    if (selected) setMeridiem(selected.meridiem);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.meridiem]);

  useEffect(() => {
    if (open && selected) {
      listRef.current
        ?.querySelector(`[data-clock="${selected.hour12}:${selected.minute}"]`)
        ?.scrollIntoView({ block: "center" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selected?.hour12, selected?.minute]);

  const pick = (hour12: number, minute: number, half: Meridiem) => {
    onChange(to24Hour(hour12, minute, half));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={`${className} text-start`} style={style}>
          <span
            className={value ? undefined : placeholderClassName}
            style={value ? labelStyle : placeholderStyle}
          >
            {value ? formatTimeLabel(value) : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-1" align="start">
        <div className="flex gap-1">
          <div ref={listRef} className="scrollbar-dark max-h-64 w-30 overflow-y-auto">
            {CLOCK_SLOTS.map(({ hour12, minute, label }) => {
              const isSelected = selected?.hour12 === hour12 && selected?.minute === minute;
              return (
                <button
                  key={label}
                  type="button"
                  data-clock={`${hour12}:${minute}`}
                  onClick={() => {
                    pick(hour12, minute, meridiem);
                    setOpen(false);
                  }}
                  className={cn(
                    "block w-full rounded-md px-3 py-1.5 text-left text-sm tabular-nums transition hover:bg-accent",
                    isSelected && "bg-accent font-semibold",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-1 border-l border-border pl-1">
            {(["AM", "PM"] as const).map((half) => (
              <button
                key={half}
                type="button"
                data-meridiem={half}
                aria-pressed={meridiem === half}
                onClick={() => {
                  setMeridiem(half);

                  if (selected) pick(selected.hour12, selected.minute, half);
                }}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition hover:bg-accent",
                  meridiem === half && "bg-accent font-semibold",
                )}
              >
                {half}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
