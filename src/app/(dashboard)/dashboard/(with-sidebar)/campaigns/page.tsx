"use client";
import { Tip } from "@/components/ui/tip";

import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  Check,
  Clock,
  MapPin,
  Megaphone,
  Pause,
  Play,
  Plus,
  ShoppingBag,
  Sparkles,
  Target,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  FaFacebook,
  FaGoogle,
  FaInstagram,
  FaSnapchat,
  FaTiktok,
  FaYoutube,
} from "react-icons/fa6";
import { SectionHeader } from "../../_components";
import TopBar from "../../_components/top-bar";

type PlatformKey = "facebook" | "instagram" | "google" | "tiktok" | "youtube" | "snapchat";
type GoalKey = "reservations" | "orders" | "traffic" | "awareness" | "followers";
type StatusKey = "pending" | "active" | "paused";

const PLATFORMS: {
  key: PlatformKey;
  label: string;
  desc: string;
  Icon: React.ElementType;
  color: string;
}[] = [
  {
    key: "facebook",
    label: "Facebook",
    desc: "Reach nearby diners on Facebook",
    Icon: FaFacebook,
    color: "#0866FF",
  },
  {
    key: "instagram",
    label: "Instagram",
    desc: "Photo & story ads on Instagram",
    Icon: FaInstagram,
    color: "#E4405F",
  },
  {
    key: "google",
    label: "Google Ads",
    desc: "Show up on Search & Maps",
    Icon: FaGoogle,
    color: "#EA4335",
  },
  {
    key: "tiktok",
    label: "TikTok Ads",
    desc: "Short-video reach for a younger crowd",
    Icon: FaTiktok,
    color: "#e6e6e6",
  },
  {
    key: "youtube",
    label: "YouTube",
    desc: "Video ads before & during content",
    Icon: FaYoutube,
    color: "#FF0000",
  },
  {
    key: "snapchat",
    label: "Snapchat",
    desc: "Reach a younger, local audience",
    Icon: FaSnapchat,
    color: "#F7D000",
  },
];
const platformOf = (k: PlatformKey) => PLATFORMS.find((p) => p.key === k)!;

const GOALS: { key: GoalKey; label: string; desc: string; Icon: React.ElementType }[] = [
  {
    key: "reservations",
    label: "More reservations",
    desc: "Fill more tables",
    Icon: CalendarCheck,
  },
  {
    key: "orders",
    label: "More online orders",
    desc: "Drive delivery & pickup",
    Icon: ShoppingBag,
  },
  { key: "traffic", label: "More foot traffic", desc: "Get walk-ins from nearby", Icon: MapPin },
  { key: "awareness", label: "Brand awareness", desc: "Get your venue known", Icon: Sparkles },
  { key: "followers", label: "More followers", desc: "Grow your social audience", Icon: Users },
];
const goalOf = (k: GoalKey) => GOALS.find((g) => g.key === k)!;

const STATUS_HINT: Record<StatusKey, string> = {
  pending: "Waiting to be reviewed before it goes live",
  active: "Running and spending budget right now",
  paused: "Temporarily stopped - no budget is being spent",
};

const STATUS: Record<StatusKey, { label: string; cls: string; dot: string }> = {
  pending: { label: "Pending review", cls: "border-info/30 bg-info/10 text-info", dot: "bg-info" },
  active: {
    label: "Active",
    cls: "border-success/30 bg-success/10 text-success",
    dot: "bg-success",
  },
  paused: {
    label: "Paused",
    cls: "border-warning/30 bg-warning/10 text-warning",
    dot: "bg-warning",
  },
};

const BUDGET_PRESETS = [200, 400, 800, 1500];
const AGE_BANDS = ["18–24", "25–34", "35–44", "45–54", "55+"];
const DURATIONS = ["2 weeks", "1 month", "3 months", "Ongoing"];
const STEPS = ["Platforms", "Goal", "Budget", "Audience", "Review"];

type Campaign = {
  id: string;
  title: string;
  platforms: PlatformKey[];
  goal: GoalKey;
  budget: number;
  radius: number;
  ages: string[];
  duration: string;
  estReach: number;
  status: StatusKey;
  createdAt: string;
};

const Page = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [view, setView] = useState<"list" | "wizard">("list");

  const addCampaign = (c: Campaign) => {
    setCampaigns((prev) => [c, ...prev]);
    setView("list");
    toast.success("Campaign created", {
      description: "Our team will set it up and reach out shortly.",
    });
  };

  const setStatus = (id: string, status: StatusKey) =>
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  const remove = (c: Campaign) => {
    setCampaigns((prev) => prev.filter((x) => x.id !== c.id));
    toast("Campaign removed", { description: `“${c.title}” was deleted.` });
  };

  return (
    <>
      <TopBar page="Campaigns" />

      <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
        <SectionHeader
          iconClassName="text-white"
          icon={Megaphone}
          title="Run ads for your restaurant"
          description="Answer a few quick questions and we'll set up your advertising campaign for you."
          badge="Advertising"
          actions={
            view === "list" && campaigns.length > 0 ? (
              <button
                onClick={() => setView("wizard")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-background transition hover:bg-white/90"
              >
                <Plus className="h-4 w-4" /> New campaign
              </button>
            ) : undefined
          }
        />

        {view === "wizard" ? (
          <Wizard onCancel={() => setView("list")} onCreate={addCampaign} />
        ) : (
          <CampaignsTable
            campaigns={campaigns}
            onNew={() => setView("wizard")}
            onSetStatus={setStatus}
            onRemove={remove}
          />
        )}
      </div>
    </>
  );
};

const CampaignsTable = ({
  campaigns,
  onNew,
  onSetStatus,
  onRemove,
}: {
  campaigns: Campaign[];
  onNew: () => void;
  onSetStatus: (id: string, s: StatusKey) => void;
  onRemove: (c: Campaign) => void;
}) => {
  if (campaigns.length === 0) {
    return (
      <div className="dash-card animate-fade-in rounded-2xl border border-white/5 bg-surface-1 px-4 py-10 text-center sm:p-12">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-background">
          <Megaphone className="h-5 w-5 text-white" />
        </div>
        <h2 className="mt-5 font-inter-tight text-2xl font-semibold">No campaigns yet</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Set up your first ad campaign and it will appear here.
        </p>
        <button
          onClick={onNew}
          className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-background transition hover:bg-white/90"
        >
          <Plus className="h-4 w-4" /> Set up a campaign
        </button>
      </div>
    );
  }

  return (
    <div className="dash-card overflow-hidden rounded-2xl border border-white/5 bg-surface-1">
      {/* Column headers only make sense once the row is a real table row (lg+) */}
      <div className="hidden grid-cols-12 gap-2 border-b border-white/5 px-4 py-3 font-jetbrains-mono text-[10px] uppercase tracking-[0.12rem] text-muted-foreground lg:grid">
        <div className="col-span-4">Campaign</div>
        <div className="col-span-2">Platforms</div>
        <div className="col-span-2 text-right">Budget</div>
        <div className="col-span-2 text-right">Est. reach</div>
        <div className="col-span-2">Status</div>
      </div>

      <div className="divide-y divide-white/5">
        {campaigns.map((c) => {
          const st = STATUS[c.status];
          return (
            <div
              key={c.id}
              className="group flex flex-col gap-2.5 px-4 py-3.5 transition hover:bg-white/2 lg:grid lg:grid-cols-12 lg:items-center lg:gap-2"
            >
              {/* Campaign */}
              <div className="flex min-w-0 items-center gap-3 lg:col-span-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-background text-white">
                  <Target className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <Tip label={c.title}>
                    <div className="truncate text-sm font-medium">{c.title}</div>
                  </Tip>
                  <div className="font-jetbrains-mono text-[9px] uppercase tracking-[0.12rem] text-muted-foreground">
                    {c.radius} km · {c.duration} · {c.createdAt}
                  </div>
                </div>
              </div>

              {/* Platforms · budget · reach - one row on mobile, real columns from lg */}
              <div className="flex items-center justify-between gap-2 lg:contents">
                {/* Platforms */}
                <div className="flex shrink-0 items-center gap-1.5 lg:col-span-2">
                  {c.platforms.map((p) => {
                    const P = platformOf(p);
                    return (
                      <Tip key={p} label={P.label}>
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/10 bg-background"
                          style={{ color: P.color }}
                        >
                          <P.Icon className="h-3 w-3" />
                        </span>
                      </Tip>
                    );
                  })}
                </div>

                {/* Budget */}
                <Tip label="Monthly ad spend">
                  <div className="text-right text-sm tabular-nums lg:col-span-2">
                    €{c.budget.toLocaleString()}/mo
                  </div>
                </Tip>

                {/* Reach */}
                <Tip label="Estimated people reached each month">
                  <div className="text-right text-sm tabular-nums text-white lg:col-span-2">
                    ≈ {c.estReach.toLocaleString()}
                  </div>
                </Tip>
              </div>

              {/* Status + actions */}
              <div className="flex items-center justify-between gap-1 lg:col-span-2">
                <Tip label={STATUS_HINT[c.status]}>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                      st.cls,
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", st.dot)} />
                    {st.label}
                  </span>
                </Tip>
                <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100">
                  {c.status === "paused" ? (
                    <Tip label="Resume this campaign">
                      <button
                        onClick={() => {
                          onSetStatus(c.id, "active");
                          toast.success(`Resumed “${c.title}”`);
                        }}
                        aria-label="Resume campaign"
                        className="rounded p-2 text-muted-foreground hover:bg-white/5 hover:text-success lg:p-1"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </button>
                    </Tip>
                  ) : (
                    <Tip label="Pause this campaign">
                      <button
                        onClick={() => {
                          onSetStatus(c.id, "paused");
                          toast(`Paused “${c.title}”`);
                        }}
                        aria-label="Pause campaign"
                        className="rounded p-2 text-muted-foreground hover:bg-white/5 hover:text-warning lg:p-1"
                      >
                        <Pause className="h-3.5 w-3.5" />
                      </button>
                    </Tip>
                  )}
                  <Tip label="Delete campaign">
                    <button
                      onClick={() => onRemove(c)}
                      aria-label="Delete campaign"
                      className="rounded p-2 text-muted-foreground hover:bg-white/5 hover:text-danger lg:p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </Tip>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Wizard = ({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (c: Campaign) => void;
}) => {
  const [step, setStep] = useState(0);
  const [platforms, setPlatforms] = useState<PlatformKey[]>(["facebook", "instagram"]);
  const [goal, setGoal] = useState<GoalKey | null>("reservations");
  const [budget, setBudget] = useState(400);
  const [radius, setRadius] = useState(10);
  const [ages, setAges] = useState<string[]>(["25–34", "35–44"]);
  const [duration, setDuration] = useState("1 month");

  const estReach = Math.round(budget * 130);
  const perDay = Math.round(budget / 30);

  const togglePlatform = (k: PlatformKey) =>
    setPlatforms((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  const toggleAge = (a: string) =>
    setAges((p) => (p.includes(a) ? p.filter((x) => x !== a) : [...p, a]));

  const canProceed = () => {
    if (step === 0) return platforms.length > 0;
    if (step === 1) return !!goal;
    if (step === 3) return ages.length > 0;
    return true;
  };

  const next = () => {
    if (!canProceed()) {
      const msg =
        step === 0
          ? "Pick at least one platform"
          : step === 1
            ? "Choose a goal"
            : "Select at least one age group";
      toast.error(msg);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => (step === 0 ? onCancel() : setStep((s) => s - 1));

  const submit = () => {
    if (!goal) return;
    onCreate({
      // eslint-disable-next-line react-hooks/purity
      id: `c${Date.now()}`,
      title: goalOf(goal).label,
      platforms,
      goal,
      budget,
      radius,
      ages,
      duration,
      estReach,
      status: "pending",
      createdAt: "just now",
    });
  };

  const platformLabels = platforms.map((p) => platformOf(p).label);
  const goalLabel = goal ? goalOf(goal).label : "-";

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Left rail - stepper + live summary */}
      <aside className="lg:col-span-1">
        <div className="dash-card rounded-2xl border border-white/5 bg-surface-1 p-4 sm:p-5 lg:sticky lg:top-6">
          <div className="font-jetbrains-mono text-[10px] uppercase tracking-[0.12rem] text-muted-foreground">
            Campaign setup
          </div>
          <ol className="mt-4 space-y-1">
            {STEPS.map((label, i) => {
              const state = i < step ? "done" : i === step ? "current" : "todo";
              return (
                <li key={label}>
                  <button
                    onClick={() => {
                      if (i < step) setStep(i);
                    }}
                    disabled={i > step}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition",
                      state === "current"
                        ? "bg-white/10 text-foreground"
                        : state === "done"
                          ? "text-foreground hover:bg-white/5"
                          : "cursor-default text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px]",
                        state === "done"
                          ? "border-white bg-white text-background"
                          : state === "current"
                            ? "border-white text-white"
                            : "border-white/15 text-muted-foreground",
                      )}
                    >
                      {state === "done" ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                    {label}
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="my-4 border-t border-white/5" />

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Platforms</span>
              <span className="flex items-center gap-1.5">
                {platforms.length ? (
                  platforms.map((p) => {
                    const P = platformOf(p);
                    return <P.Icon key={p} className="h-3.5 w-3.5" style={{ color: P.color }} />;
                  })
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Goal</span>
              <span className="truncate text-right font-medium">{goalLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Budget</span>
              <span className="font-medium">€{budget.toLocaleString()}/mo</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/20 bg-white/5 px-3 py-2">
              <span className="text-muted-foreground">Est. reach</span>
              <span className="font-semibold text-white">≈ {estReach.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Right - current step */}
      <div className="dash-card overflow-hidden rounded-2xl border border-white/5 bg-surface-1 lg:col-span-2">
        {/* Progress */}
        <div className="border-b border-white/5 px-4 pb-4 pt-5 sm:px-6">
          <div className="flex items-center justify-between">
            <span className="font-jetbrains-mono text-[10px] uppercase tracking-[0.12rem] text-muted-foreground">
              Step {step + 1} of {STEPS.length}
            </span>
            <span className="text-xs font-medium text-white">{STEPS[step]}</span>
          </div>
          <div className="mt-3 flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i <= step ? "bg-white" : "bg-white/10",
                )}
              />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-4 py-5 sm:px-6 sm:py-6">
          {step === 0 && (
            <Question
              title="Where do you want to run your ads?"
              hint="Choose one or more - you can change this later."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {PLATFORMS.map((p) => {
                  const active = platforms.includes(p.key);
                  return (
                    <button
                      key={p.key}
                      onClick={() => togglePlatform(p.key)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-4 text-left transition",
                        active
                          ? "border-white/50 bg-white/10"
                          : "border-white/10 bg-background hover:border-white/20",
                      )}
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-surface-2"
                        style={{ color: p.color }}
                      >
                        <p.Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{p.label}</span>
                        <span className="block text-[11px] text-muted-foreground">{p.desc}</span>
                      </span>
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-md border",
                          active ? "border-white bg-white text-background" : "border-white/20",
                        )}
                      >
                        {active && <Check className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Question>
          )}

          {step === 1 && (
            <Question
              title="What's your main goal?"
              hint="We'll optimise the campaign around this."
            >
              <div className="grid gap-2.5 sm:grid-cols-2">
                {GOALS.map((g) => {
                  const active = goal === g.key;
                  return (
                    <button
                      key={g.key}
                      onClick={() => setGoal(g.key)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-3.5 text-left transition",
                        active
                          ? "border-white/50 bg-white/10"
                          : "border-white/10 bg-background hover:border-white/20",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10",
                          active ? "bg-white/15 text-white" : "bg-surface-2 text-muted-foreground",
                        )}
                      >
                        <g.Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{g.label}</span>
                        <span className="block text-[11px] text-muted-foreground">{g.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </Question>
          )}

          {step === 2 && (
            <Question
              title="What's your monthly ad budget?"
              hint="This is what you'll spend on the ads themselves."
            >
              <div className="flex flex-wrap gap-2">
                {BUDGET_PRESETS.map((b) => (
                  <button
                    key={b}
                    onClick={() => setBudget(b)}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-sm transition",
                      budget === b
                        ? "border-white/50 bg-white/10 text-foreground"
                        : "border-white/10 bg-background text-muted-foreground hover:border-white/20",
                    )}
                  >
                    €{b.toLocaleString()}
                  </button>
                ))}
              </div>
              <div className="mt-6">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="font-inter-tight text-3xl font-bold tracking-tight">
                      €{budget.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-muted-foreground">≈ €{perDay}/day</div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-background px-3 py-2 text-right">
                    <div className="font-jetbrains-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      Est. reach / mo
                    </div>
                    <div className="text-sm font-semibold text-white">
                      ≈ {estReach.toLocaleString()}
                    </div>
                  </div>
                </div>
                <input
                  type="range"
                  min={100}
                  max={3000}
                  step={50}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="mt-4 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-white"
                />
                <div className="mt-1.5 flex justify-between font-jetbrains-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  <span>€100</span>
                  <span>€3,000</span>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Reach is a rough estimate and varies by location, competition and creative.
              </p>
            </Question>
          )}

          {step === 3 && (
            <Question
              title="Who should see your ads?"
              hint="Target the people most likely to visit."
            >
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Distance from your venue</label>
                    <span className="text-sm text-white">{radius} km</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={50}
                    step={1}
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-white"
                  />
                  <div className="mt-1.5 flex justify-between font-jetbrains-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    <span>1 km</span>
                    <span>50 km</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Age groups</label>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {AGE_BANDS.map((a) => {
                      const active = ages.includes(a);
                      return (
                        <button
                          key={a}
                          onClick={() => toggleAge(a)}
                          className={cn(
                            "rounded-full border px-3.5 py-1.5 text-sm transition",
                            active
                              ? "border-white/50 bg-white/10 text-foreground"
                              : "border-white/10 bg-background text-muted-foreground hover:border-white/20",
                          )}
                        >
                          {a}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">How long should it run?</label>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {DURATIONS.map((d) => (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition",
                          duration === d
                            ? "border-white/50 bg-white/10 text-foreground"
                            : "border-white/10 bg-background text-muted-foreground hover:border-white/20",
                        )}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Question>
          )}

          {step === 4 && (
            <Question title="Review your campaign" hint="Here's what we'll set up for you.">
              <div className="divide-y divide-white/5 rounded-xl border border-white/10 bg-background">
                <ReviewRow
                  icon={Megaphone}
                  label="Platforms"
                  value={platformLabels.join(", ") || "-"}
                />
                <ReviewRow icon={Target} label="Goal" value={goalLabel} />
                <ReviewRow
                  icon={Wallet}
                  label="Budget"
                  value={`€${budget.toLocaleString()}/mo · ≈ €${perDay}/day`}
                />
                <ReviewRow icon={MapPin} label="Target radius" value={`${radius} km`} />
                <ReviewRow icon={Users} label="Age groups" value={ages.join(", ") || "-"} />
                <ReviewRow icon={Clock} label="Duration" value={duration} />
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3">
                <Sparkles className="h-4 w-4 shrink-0 text-white" />
                <p className="text-[12px] text-muted-foreground">
                  Estimated reach of{" "}
                  <span className="font-medium text-foreground">≈ {estReach.toLocaleString()}</span>{" "}
                  people per month.
                </p>
              </div>
            </Question>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between gap-2 border-t border-white/5 px-4 py-4 sm:px-6">
          <button
            onClick={back}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {step === 0 ? "Cancel" : "Back"}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={next}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-5 py-2 text-xs font-semibold text-background transition hover:bg-white/90"
            >
              Continue <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={submit}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-5 py-2 text-xs font-semibold text-background transition hover:bg-white/90"
            >
              <Check className="h-3.5 w-3.5" /> Create campaign
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Question = ({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div>
    <h2 className="font-inter-tight text-lg font-semibold tracking-tight">{title}</h2>
    {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    <div className="mt-5">{children}</div>
  </div>
);

const ReviewRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) => (
  <div className="flex items-center gap-3 px-4 py-3">
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-surface-2 text-muted-foreground">
      <Icon className="h-4 w-4" />
    </span>
    <span className="font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
      {label}
    </span>
    <span className="ml-auto text-right text-sm font-medium">{value}</span>
  </div>
);

export default Page;
