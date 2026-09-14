"use client";
import { PopupType } from "@/drizzle/types";
import { useRestaurantPopups, useTogglePopupStatus } from "@/lib/tanstack-react-query/hooks/popups";
import { useSelectedRestaurant } from "@/stores/restaurant-store";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Sparkles, X, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Loader from "@/components/ui/loader";

const statusStyle: Record<PopupType["status"], string> = {
  live: "border-success/30 bg-success/10 text-success",
  paused: "border-white/10 bg-background text-muted-foreground",
};
const statusLabel: Record<PopupType["status"], string> = {
  live: "On",
  paused: "Off",
};
const triggerLabel: Record<PopupType["trigger_after_seconds"], string> = {
  0: "Immediately",
  10: "After 10s",
  30: "After 30s",
  60: "After 1m",
};

const SettingsPopupsClientPage = () => {
  const { data: popups = [], isPending } = useRestaurantPopups();
  const toggleMutation = useTogglePopupStatus();
  const restaurant = useSelectedRestaurant();
  const slug = restaurant?.slug || "your-venue";

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Keep a valid selection as popups change.
  useEffect(() => {
    if (popups.length === 0) {
      setSelectedId(null);
    } else if (!popups.some((p) => p.id === selectedId)) {
      setSelectedId(popups.find((p) => p.status === "live")?.id ?? popups[0].id);
    }
  }, [popups, selectedId]);

  const activeCount = useMemo(() => popups.filter((p) => p.status !== "paused").length, [popups]);
  const selected = popups.find((p) => p.id === selectedId) ?? null;

  const handleToggle = (p: PopupType, on: boolean) => {
    toggleMutation.mutate(
      { id: p.id, status: on ? "live" : "paused" },
      { onError: (err) => toast.error(err.message) },
    );
  };

  if (isPending) {
    return <Loader className="min-h-75" />;
  }

  return (
    <section
      aria-labelledby="settings-panel-title"
      className="dash-card relative h-fit rounded-2xl border border-white/5 bg-surface-1 p-4 sm:p-6"
    >
      {/* header */}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-white/5 pb-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white">
            <Zap className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 id="settings-panel-title" className="font-inter-tight text-xl font-semibold">
              Popups
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Turn your popups on or off. Design and edit them on the{" "}
              <Link href="/dashboard/popups" className="text-white hover:underline">
                Popups page
              </Link>
              .
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/10 bg-background px-2.5 py-1 text-xs tabular-nums text-muted-foreground">
            {activeCount} / {popups.length} active
          </span>
          <Link
            href="/dashboard/popups"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-background px-3 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            Design popups <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {popups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-background p-10 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-muted-foreground" />
          <h3 className="font-inter-tight mt-3 text-base font-semibold">No popups yet</h3>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
            Create your first popup to promote an offer, event or announcement.
          </p>
          <Link
            href="/dashboard/popups"
            className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3.5 text-xs font-semibold text-background hover:bg-white/90"
          >
            Design a popup <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* left: manage list */}
          <div className="space-y-2.5">
            {popups.map((p) => (
              <ManageRow
                key={p.id}
                p={p}
                isSelected={selectedId === p.id}
                onSelect={() => setSelectedId(p.id)}
                onToggle={(on) => handleToggle(p, on)}
              />
            ))}
            <p className="pt-1 text-[11px] leading-relaxed text-muted-foreground">
              When several popups are active, guests see the highest one in this list first. Reorder
              or edit content on the{" "}
              <Link href="/dashboard/popups" className="text-foreground hover:underline">
                Popups page
              </Link>
              .
            </p>
          </div>

          {/* right: preview */}
          <div className="self-start lg:sticky lg:top-24">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Live preview</span>
              <span className="font-jetbrains-mono text-[9px] uppercase text-muted-foreground">
                dineri.app/{slug}
              </span>
            </div>
            <PreviewFrame popup={selected} slug={slug} />
            {selected && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                {selected.status === "paused"
                  ? "This popup is off - enable it to show it to guests."
                  : `Shows ${(triggerLabel[selected.trigger_after_seconds] ?? "on load").toLowerCase()}.`}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default SettingsPopupsClientPage;

/* ------------------------------------------------------------------ */

const ManageRow = ({
  p,
  isSelected,
  onSelect,
  onToggle,
}: {
  p: PopupType;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: (on: boolean) => void;
}) => {
  const on = p.status !== "paused";
  return (
    <div
      onClick={onSelect}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-2xl border bg-background p-3 transition",
        isSelected
          ? "border-white/40 ring-1 ring-white/30"
          : "border-white/10 hover:border-white/20",
        !on && "opacity-70",
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-white/20 to-emerald-500/10 text-white">
        <Sparkles className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold">{p.title || "Untitled popup"}</h3>
          <span
            className={cn(
              "hidden shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] uppercase tracking-wider sm:inline-flex",
              statusStyle[p.status],
            )}
          >
            {statusLabel[p.status]}
          </span>
        </div>
        <p className="truncate text-[11px] max-w-40 text-muted-foreground">{p.body}</p>
        <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="rounded bg-white/5 px-1.5 py-0.5">
            {triggerLabel[p.trigger_after_seconds] ?? "On load"}
          </span>
          <span className="tabular-nums">{p.impressions.toLocaleString()} views</span>
        </div>
      </div>
      <Toggle on={on} onChange={(v) => onToggle(v)} label={p.title || "popup"} />
    </div>
  );
};

const PreviewFrame = ({ popup, slug }: { popup: PopupType | null; slug: string }) => (
  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-surface-2 to-background p-4">
    <div className="mb-3 flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-danger/70" />
        <span className="h-2 w-2 rounded-full bg-warning/70" />
        <span className="h-2 w-2 rounded-full bg-white/70" />
      </div>
      <div className="flex-1 truncate rounded-md border border-white/5 bg-background/60 px-2 py-0.5 text-center font-jetbrains-mono text-[8px] text-muted-foreground">
        dineri.app/{slug}
      </div>
    </div>

    <div className="relative h-80 overflow-hidden rounded-xl border border-white/5 bg-background/60">
      {/* faux page */}
      <div className="space-y-2 p-3 opacity-40">
        <div className="h-16 rounded-lg bg-white/5" />
        <div className="h-3 w-2/3 rounded bg-white/10" />
        <div className="h-2 w-full rounded bg-white/5" />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="h-14 rounded-lg bg-white/5" />
          <div className="h-14 rounded-lg bg-white/5" />
        </div>
      </div>

      {popup && popup.status !== "paused" ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-56 animate-scale-in overflow-hidden rounded-2xl border border-white/10 bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
              {popup.badge ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[8px] font-medium uppercase tracking-wider text-white">
                  <Sparkles className="h-2.5 w-2.5" /> {popup.badge}
                </span>
              ) : (
                <span />
              )}
              <X className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" aria-hidden />
            </div>
            <div className="space-y-1 px-3.5 py-3">
              <div className="truncate text-sm font-semibold leading-tight">{popup.title}</div>
              <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                {popup.body}
              </p>
            </div>
            <div className="px-3.5 pb-3.5 pt-1">
              <span className="block w-full rounded-lg bg-white px-3 py-1.5 text-center text-[11px] font-semibold text-background">
                {popup.cta}
              </span>
              {popup.footerNote && (
                <p className="mt-1.5 truncate text-center text-[9px] text-muted-foreground">
                  {popup.footerNote}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-[11px] text-muted-foreground">
          {popup
            ? "This popup is off. Turn it on to preview what guests will see."
            : "Select a popup to preview it."}
        </div>
      )}
    </div>
  </div>
);

const Toggle = ({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={`${on ? "Disable" : "Enable"} ${label}`}
    onClick={(e) => {
      e.stopPropagation();
      onChange(!on);
    }}
    className={cn(
      "relative h-5 w-9 shrink-0 rounded-full border transition",
      on ? "border-white/40 bg-white/30" : "border-white/10 bg-white/5",
    )}
  >
    <span
      className={cn(
        "absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full transition-all",
        on ? "left-4.5 bg-white" : "left-0.5 bg-white/40",
      )}
    />
  </button>
);
