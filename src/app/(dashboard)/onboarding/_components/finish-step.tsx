import { Sparkles } from "lucide-react";
import { Data } from "@/lib/types/onboarding";

export const StepFinish = ({ data }: { data: Data }) => (
  <div className="space-y-4">
    <div className="rounded-2xl border border-white/10 bg-background/40 p-5">
      <div className="font-mono-label text-[10px] text-muted-foreground">Venue</div>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <Row label="Venue" value={data.venue || "-"} />
        <Row label="Cuisine" value={data.cuisine || "-"} />
        <Row label="City" value={data.city || "-"} />
        <Row label="Phone" value={data.phone || "-"} />
        <Row label="Hours" value={`${data.hoursFrom}–${data.hoursTo}`} />
        <Row
          label="Closed"
          value={data.closedDays.length ? data.closedDays.join(", ") : "Open daily"}
        />
        <Row label="Template" value={data.brandColor} />
        <Row label="Menu" value={`${data.menuSize} · ${data.importMethod}`} />
      </dl>
    </div>

    <div className="rounded-2xl border border-lime/20 bg-lime/4 p-5">
      <div className="font-mono-label text-[10px] text-lime">Diner intelligence</div>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <Row label="Diners" value={data.diners.join(", ") || "-"} />
        <Row label="Dietary" value={data.dietary.join(", ") || "-"} />
        <Row label="Top categories" value={data.topCategories.join(", ") || "-"} />
        <Row label="Peak times" value={data.peakTimes.join(", ") || "-"} />
        <Row
          label="Avg spend"
          value={
            data.avgSpend === "under15"
              ? "< $15"
              : data.avgSpend === "15to30"
                ? "$15–30"
                : data.avgSpend === "30to60"
                  ? "$30–60"
                  : "$60+"
          }
        />
        <Row label="Channels" value={data.channels.join(", ") || "-"} />
        <Row label="Priorities" value={data.priorities.join(", ") || "-"} />
        <Row label="Pain points" value={data.painPoints.join(", ") || "-"} />
      </dl>
    </div>

    <div className="flex items-center gap-2 rounded-xl border border-lime/20 bg-lime/5 px-3 py-2.5 text-xs">
      <Sparkles className="h-3.5 w-3.5 text-lime" />
      We&apos;ll use this to tailor your dashboard suggestions, popups and analytics.
    </div>
  </div>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col">
    <dt className="font-mono-label text-[9px] uppercase text-muted-foreground">{label}</dt>
    <dd className="mt-0.5 text-foreground">{value}</dd>
  </div>
);
