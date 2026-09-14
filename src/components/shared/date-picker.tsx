"use client";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  invalid?: boolean;
};

function parseDay(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(`${value}T00:00:00`);
  return isNaN(parsed.getTime()) ? undefined : parsed;
}

export function DatePicker({
  value,
  onChange,
  minDate,
  placeholder = "Pick a date",
  className,
  id,
  disabled,
  invalid,
}: Props) {
  const [open, setOpen] = useState(false);

  const selected = parseDay(value);
  const min = parseDay(minDate);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          data-invalid={invalid || undefined}
          className={cn(
            "flex w-full items-center gap-2 rounded-xl border border-input bg-background px-3 text-left transition-colors outline-none",
            "focus-visible:border-white/40 focus-visible:ring-[3px] focus-visible:ring-white/30",
            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            "data-invalid:border-destructive data-invalid:ring-[3px] data-invalid:ring-destructive/20",
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className={cn("truncate", !selected && "text-muted-foreground/60")}>
            {selected ? format(selected, "EEE, MMM d, yyyy") : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? min}
          disabled={min ? (day) => day < min : undefined}
          onSelect={(day) => {
            if (!day) return;
            onChange(format(day, "yyyy-MM-dd"));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
