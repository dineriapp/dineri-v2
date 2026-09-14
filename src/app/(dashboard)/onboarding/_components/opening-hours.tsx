"use client";
import React from "react";
import { Data } from "@/lib/types/onboarding";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type Props = {
  update: <K extends keyof Data>(k: K, v: Data[K]) => void;
  data: Data;
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const OpeningHours = ({ data, update }: Props) => {
  return (
    <div className="space-y-3">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
            Opens at
          </Label>
          <Input
            type="time"
            className="h-11 w-full "
            value={data.hoursFrom}
            onChange={(e) => update("hoursFrom", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
            Closes at
          </Label>
          <Input
            type="time"
            className="h-11 w-full "
            value={data.hoursTo}
            onChange={(e) => update("hoursTo", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
          Closed days
        </Label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => {
            const on = data.closedDays.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() =>
                  update(
                    "closedDays",
                    on ? data.closedDays.filter((x) => x !== d) : [...data.closedDays, d],
                  )
                }
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                  on
                    ? "border-lime bg-lime/10 text-foreground"
                    : "border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
        <span className="mt-1 block text-[11px] text-muted-foreground">
          Tap days when you&apos;re not open.
        </span>
      </div>
    </div>
  );
};

export default OpeningHours;
