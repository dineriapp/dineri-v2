"use client";

import { PlanLimitBanner } from "@/components/shared/plan-limit-banner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Loader from "@/components/ui/loader";
import { Tip } from "@/components/ui/tip";
import { PopupType } from "@/drizzle/types";
import { useAuth } from "@/lib/auth/hooks/use-auth";
import { canAddClient, getResourceLimitClient } from "@/lib/stripe/client";
import {
  useDeletePopup,
  useRestaurantPopups,
  useTogglePopupStatus,
} from "@/lib/tanstack-react-query/hooks/popups";
import { cn } from "@/lib/utils";
import {
  Clock,
  Eye,
  EyeOff,
  Image as ImageIcon,
  MousePointerClick,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { SectionHeader, StatCard } from "../../../_components";
import TopBar from "../../../_components/top-bar";
import PopupDialog from "./popup-dialog";

const statusStyle: Record<PopupType["status"], string> = {
  live: "border-success/30 bg-success/10 text-success",
  paused: "border-white/10 bg-background text-muted-foreground",
};

const statusLabel: Record<PopupType["status"], string> = {
  live: "On",
  paused: "Off",
};

const statusHint: Record<PopupType["status"], string> = {
  live: "On - currently showing to visitors",
  paused: "Off - not showing to visitors",
};

const TRIGGERS: { key: PopupType["trigger_after_seconds"]; label: string; short: string }[] = [
  { key: 0, label: "Immediately", short: "Immediately" },
  { key: 10, label: "After 10 seconds", short: "After 10s" },
  { key: 30, label: "After 30 seconds", short: "After 30s" },
  { key: 60, label: "After 1 minute", short: "After 1m" },
];
const triggerShort = (t: PopupType["trigger_after_seconds"]) =>
  TRIGGERS.find((x) => x.key === t)?.short ?? `${t}s`;
const triggerLabel = (t: PopupType["trigger_after_seconds"]) =>
  TRIGGERS.find((x) => x.key === t)?.label ?? `${t}s`;

const ON_PAGE_OPTIONS: { key: PopupType["onPage"]; label: string }[] = [
  { key: "restaurant", label: "Restaurant page" },
  { key: "menu", label: "Menu page" },
  { key: "reserve", label: "Reserve table page" },
];
const onPageLabel = (v: PopupType["onPage"]) =>
  ON_PAGE_OPTIONS.find((x) => x.key === v)?.label ?? v;

const Card = ({
  p,
  onEdit,
  onDelete,
  onToggle,
  toggling,
}: {
  p: PopupType;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  toggling: boolean;
}) => {
  const ctrNum = p.impressions ? (p.clicks / p.impressions) * 100 : 0;
  const ctr = ctrNum.toFixed(1);
  const paused = p.status === "paused";

  return (
    <div
      className={cn(
        "dash-card group relative flex flex-col rounded-2xl border bg-surface-1 transition-all duration-200",
        paused
          ? "border-white/5 opacity-70 hover:opacity-100"
          : "border-white/10 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-elevated",
      )}
    >
      <div className="relative h-24 overflow-hidden rounded-t-2xl bg-linear-to-br from-white/15 via-emerald-500/8 to-transparent">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.09) 1px, transparent 1px)",
            backgroundSize: "13px 13px",
          }}
        />
        <Tip label={statusHint[p.status]}>
          <span
            className={cn(
              "absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider backdrop-blur",
              statusStyle[p.status],
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full bg-current",
                p.status === "live" && "animate-pulse",
              )}
            />
            {statusLabel[p.status]}
          </span>
        </Tip>
        <div className="absolute bottom-3 left-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-background/80 text-white shadow-lg ring-1 ring-white/5 backdrop-blur">
          <Sparkles className="h-5 w-5" />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h4 className="font-inter-tight text-[15px] font-semibold leading-tight">
          {p.title || "Untitled popup"}
        </h4>
        <Tip label={p.body}>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {p.body}
          </p>
        </Tip>

        <div className="mt-3">
          <Tip label="Call-to-action button label">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white">
              <MousePointerClick className="h-3 w-3" /> {p.cta}
            </span>
          </Tip>
        </div>

        <div className="mt-3 rounded-xl border border-white/5 bg-background p-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Tip label="Times this popup was shown">
              <div>
                <div className="font-jetbrains-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  Views
                </div>
                <div className="mt-0.5 text-sm font-semibold tabular-nums">
                  {p.impressions.toLocaleString()}
                </div>
              </div>
            </Tip>
            <Tip label="Times the call-to-action was clicked">
              <div className="border-x border-white/5">
                <div className="font-jetbrains-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  Clicks
                </div>
                <div className="mt-0.5 text-sm font-semibold tabular-nums">
                  {p.clicks.toLocaleString()}
                </div>
              </div>
            </Tip>
            <Tip label="Click-through rate - clicks ÷ views">
              <div>
                <div className="font-jetbrains-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  CTR
                </div>
                <div className="mt-0.5 text-sm font-semibold tabular-nums text-white">{ctr}%</div>
              </div>
            </Tip>
          </div>
          <Tip label={`${ctr}% click-through rate`}>
            <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-linear-to-r from-white to-emerald-400 transition-all"
                style={{ width: `${Math.min(100, ctrNum * 8)}%` }}
              />
            </div>
          </Tip>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Tip label={`Shows ${triggerLabel(p.trigger_after_seconds).toLowerCase()}`}>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3 shrink-0" />
                {triggerShort(p.trigger_after_seconds)}
              </span>
            </Tip>
            <Tip label={`Shown on the ${onPageLabel(p.onPage).toLowerCase()}`}>
              <span className="truncate rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {onPageLabel(p.onPage)}
              </span>
            </Tip>
          </div>
          <div className="flex items-center gap-0.5">
            <Tip label={p.status === "live" ? "Pause this popup" : "Set live"}>
              <button
                onClick={onToggle}
                disabled={toggling}
                className="rounded-md p-1.5 text-muted-foreground transition hover:bg-white/5 hover:text-foreground disabled:opacity-50"
                aria-label="Toggle"
              >
                {p.status === "live" ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </Tip>
            <Tip label="Edit popup">
              <button
                onClick={onEdit}
                className="rounded-md p-1.5 text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
                aria-label="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </Tip>
            <Tip label="Delete popup">
              <button
                onClick={onDelete}
                className="rounded-md p-1.5 text-muted-foreground transition hover:bg-danger/10 hover:text-danger"
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </Tip>
          </div>
        </div>
      </div>
    </div>
  );
};

const PopupsClientPage = () => {
  const { user } = useAuth();
  const { data: popupsList = [], isPending } = useRestaurantPopups();
  const toggleMutation = useTogglePopupStatus();
  const deleteMutation = useDeletePopup();
  const [open, setOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<PopupType | null>(null);
  const [filter, setFilter] = useState<"all" | "live" | "paused">("all");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const plan = user?.subscription?.plan ?? "starter";
  const canAddMore = canAddClient(plan, "popups", popupsList.length);

  const totals = useMemo(
    () => ({
      total: popupsList.length,
      live: popupsList.filter((i) => i.status === "live").length,
      impressions: popupsList.reduce((s, i) => s + i.impressions, 0),
      clicks: popupsList.reduce((s, i) => s + i.clicks, 0),
    }),
    [popupsList],
  );

  const filtered = filter === "all" ? popupsList : popupsList.filter((i) => i.status === filter);

  const handleAdd = () => {
    if (!canAddMore) {
      toast.error(
        `Your ${plan} plan allows up to ${getResourceLimitClient(plan, "popups")} popups. Please upgrade to add more.`,
      );
      return;
    }
    setEditingRow(null);
    setOpen(true);
  };

  const handleEdit = (p: PopupType) => {
    setEditingRow(p);
    setOpen(true);
  };

  const handleToggle = (p: PopupType) => {
    toggleMutation.mutate(
      { id: p.id, status: p.status === "live" ? "paused" : "live" },
      {
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const openDeleteConfirm = (id: string) => {
    setPendingDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!pendingDeleteId) return;
    deleteMutation.mutate(pendingDeleteId, {
      onSuccess: () => {
        toast.success("Popup deleted");
        setDeleteConfirmOpen(false);
        setPendingDeleteId(null);
      },
      onError: (error) => {
        toast.error(error.message);
        setDeleteConfirmOpen(false);
        setPendingDeleteId(null);
      },
    });
  };

  if (isPending) {
    return <Loader className="min-h-75" />;
  }

  return (
    <>
      <TopBar page="Popups" />

      <div className="p-4 space-y-4 animate-fade-in sm:p-6 sm:space-y-6">
        <SectionHeader
          iconClassName="text-white"
          icon={Sparkles}
          title="Popups"
          description="Promote events, offers and announcements with timed popups on your public page."
          actions={
            <button
              onClick={handleAdd}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-background hover:bg-white/90"
            >
              <Plus className="h-3.5 w-3.5" /> New popup
            </button>
          }
        />

        <PlanLimitBanner resource="popups" currentCount={popupsList.length} warningThreshold={2} />

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          <StatCard label="All popups" value={totals.total} icon={ImageIcon} />
          <StatCard label="Live now" value={totals.live} icon={Zap} tone="white" />
          <StatCard label="Impressions" value={totals.impressions.toLocaleString()} icon={Eye} />
          <StatCard
            label="Clicks"
            value={totals.clicks.toLocaleString()}
            icon={MousePointerClick}
            tone="amber"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-surface-1 p-1">
          {(["all", "live", "paused"] as const).map((s) => {
            const count =
              s === "all" ? popupsList.length : popupsList.filter((i) => i.status === s).length;
            const active = filter === s;
            const label = s === "live" ? "On" : s === "paused" ? "Off" : "All";
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition",
                  active
                    ? "bg-white text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10px] tabular-nums",
                    active ? "bg-background/20" : "bg-white/5 text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="dash-card rounded-2xl border border-dashed border-white/10 bg-surface-1 p-12 text-center">
            <Sparkles className="mx-auto h-6 w-6 text-muted-foreground" />
            <h3 className="font-inter-tight mt-3 text-base font-semibold">No popups yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create one to drive attention to a promo or event.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {filtered.map((p) => (
              <Card
                key={p.id}
                p={p}
                onEdit={() => handleEdit(p)}
                onDelete={() => openDeleteConfirm(p.id)}
                onToggle={() => handleToggle(p)}
                toggling={toggleMutation.isPending}
              />
            ))}
          </div>
        )}

        <PopupDialog open={open} setOpen={setOpen} editingRow={editingRow ?? undefined} />
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the popup.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-danger text-destructive-foreground hover:bg-danger/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PopupsClientPage;
