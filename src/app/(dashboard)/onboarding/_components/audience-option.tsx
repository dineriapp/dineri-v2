"use client";

import { Label } from "@/components/ui/label";
import { Data } from "@/lib/types/onboarding";
import { cn } from "@/lib/utils";
import Chip from "./chip";
import { fieldAnchorId, FieldErrors } from "./validation";

const DINER_TYPES = [
  "Couples",
  "Families",
  "Solo diners",
  "Friend groups",
  "Business lunches",
  "Tourists",
  "Students",
  "Locals",
];
const DIETARY = [
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Halal",
  "Kosher",
  "Dairy-free",
  "Nut-free",
  "Keto",
];
const CATEGORIES = [
  "Pizza",
  "Burgers",
  "Pasta",
  "Sushi",
  "Salads",
  "BBQ",
  "Desserts",
  "Coffee",
  "Cocktails",
  "Wine",
  "Brunch",
  "Tapas",
];
const PEAK_TIMES = [
  "Weekday lunch",
  "Weekday dinner",
  "Friday night",
  "Saturday night",
  "Sunday brunch",
  "Late night",
];
const CHANNELS = ["Dine-in", "Pickup", "Delivery", "Reservations", "Events / private hire"];
const PRIORITIES = [
  "Food quality",
  "Speed",
  "Price",
  "Ambience",
  "Service",
  "Healthy options",
  "Portion size",
  "Instagrammable",
];
const PAINS = [
  "No-shows",
  "Slow turn-over",
  "Low repeat visits",
  "Hard to take reservations",
  "Menu hard to update",
  "Few online reviews",
  "Weak social presence",
];

type Props = {
  update: <K extends keyof Data>(k: K, v: Data[K]) => void;
  data: Data;
  errors?: FieldErrors;
};

const toggle = (arr: string[], v: string) =>
  arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

const RequiredMark = () => (
  <span className="text-red-500" aria-hidden>
    {" "}
    *
  </span>
);

const AudienceOption = ({ data, update, errors = {} }: Props) => {
  return (
    <>
      <div className="space-y-2" id={fieldAnchorId("diners")}>
        <Label className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
          Who walks through your door?
          <RequiredMark />
        </Label>
        <div
          className={cn(
            "flex flex-wrap gap-2 rounded-xl transition",
            errors.diners && "p-2 ring-1 ring-red-500/40",
          )}
        >
          {DINER_TYPES.map((d) => (
            <Chip
              key={d}
              active={data.diners.includes(d)}
              onClick={() => update("diners", toggle(data.diners, d))}
            >
              {d}
            </Chip>
          ))}
        </div>
        {errors.diners ? (
          <span role="alert" className="mt-1 block text-[11px] text-red-500">
            {errors.diners}
          </span>
        ) : (
          <span className="mt-1 block text-[11px] text-muted-foreground">Pick all that apply.</span>
        )}
      </div>
      <div className="space-y-2">
        <Label className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
          Dietary needs you commonly serve
        </Label>
        <div className="flex flex-wrap gap-2">
          {DIETARY.map((d) => (
            <Chip
              key={d}
              active={data.dietary.includes(d)}
              onClick={() => update("dietary", toggle(data.dietary, d))}
            >
              {d}
            </Chip>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
          Top-selling categories
        </Label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((d) => (
            <Chip
              key={d}
              active={data.topCategories.includes(d)}
              onClick={() => update("topCategories", toggle(data.topCategories, d))}
            >
              {d}
            </Chip>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
          Peak times
        </Label>
        <div className="flex flex-wrap gap-2">
          {PEAK_TIMES.map((d) => (
            <Chip
              key={d}
              active={data.peakTimes.includes(d)}
              onClick={() => update("peakTimes", toggle(data.peakTimes, d))}
            >
              {d}
            </Chip>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
          Average spend per guest
        </Label>
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              { v: "under15", label: "< $15" },
              { v: "15to30", label: "$15–30" },
              { v: "30to60", label: "$30–60" },
              { v: "over60", label: "$60+" },
            ] as const
          ).map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => update("avgSpend", o.v)}
              className={`rounded-xl border px-3 py-2.5 text-sm transition ${
                data.avgSpend === o.v
                  ? "border-lime bg-lime/10 text-foreground"
                  : "border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2" id={fieldAnchorId("channels")}>
        <Label className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
          How do customers order?
          <RequiredMark />
        </Label>
        <div
          className={cn(
            "flex flex-wrap gap-2 rounded-xl transition",
            errors.channels && "p-2 ring-1 ring-red-500/40",
          )}
        >
          {CHANNELS.map((d) => (
            <Chip
              key={d}
              active={data.channels.includes(d)}
              onClick={() => update("channels", toggle(data.channels, d))}
            >
              {d}
            </Chip>
          ))}
        </div>
        {errors.channels ? (
          <span role="alert" className="mt-1 block text-[11px] text-red-500">
            {errors.channels}
          </span>
        ) : (
          <span className="mt-1 block text-[11px] text-muted-foreground">Pick all that apply.</span>
        )}
      </div>
      <div className="space-y-2">
        <Label className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
          What do your diners care about most?
        </Label>
        <div className="flex flex-wrap gap-2">
          {PRIORITIES.map((d) => (
            <Chip
              key={d}
              active={data.priorities.includes(d)}
              onClick={() => update("priorities", toggle(data.priorities, d))}
            >
              {d}
            </Chip>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
          Biggest challenges right now
        </Label>
        <div className="flex flex-wrap gap-2">
          {PAINS.map((d) => (
            <Chip
              key={d}
              active={data.painPoints.includes(d)}
              onClick={() => update("painPoints", toggle(data.painPoints, d))}
            >
              {d}
            </Chip>
          ))}
        </div>
      </div>
      <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-background/40 px-4 py-3">
        <input
          type="checkbox"
          checked={data.npsAsk}
          onChange={(e) => update("npsAsk", e.target.checked)}
          className="mt-1 h-4 w-4 accent-lime"
        />
        <span className="text-sm">
          <span className="font-medium text-foreground">
            Collect a 1-tap rating after each order.
          </span>
          <span className="block text-xs text-muted-foreground">
            We&apos;ll auto-add a post-order feedback popup so you learn what guests actually love.
          </span>
        </span>
      </label>
    </>
  );
};

export default AudienceOption;
