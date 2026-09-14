"use client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";
import { ReactNode } from "react";

export type Range = "7D" | "30D" | "90D";
export const rangeDays: Record<Range, number> = { "7D": 7, "30D": 30, "90D": 90 };

export const makePoints = (n: number, base: number, variance: number, seed = 1) => {
  const out: number[] = [];
  let v = base;
  for (let i = 0; i < n; i++) {
    v += (Math.sin(i * 0.7 + seed) + Math.cos(i * 0.3 + seed * 2)) * variance * 0.2;
    out.push(Math.max(1, Math.round(v + Math.sin(i + seed) * variance)));
  }
  return out;
};

export const Sparkline = ({
  points,
  stroke = "hsl(var(--lime))",
  fill,
  dashed = false,
  height = 44,
}: {
  points: number[];
  stroke?: string;
  fill?: string;
  dashed?: boolean;
  height?: number;
}) => {
  const w = 200;
  const h = height;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = w / Math.max(points.length - 1, 1);
  const path = points
    .map((p, i) => {
      const x = i * step;
      const y = h - ((p - min) / range) * (h - 6) - 3;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const area = fill && `${path} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full" preserveAspectRatio="none">
      {area && <path d={area} fill={fill} />}
      <path
        d={path}
        stroke={stroke}
        strokeWidth={1.5}
        fill="none"
        strokeDasharray={dashed ? "3 3" : undefined}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

type Props = {
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: string;
  actions?: ReactNode;
  iconClassName?: string;
};

/**
 * Consistent header used across every dashboard sub-page.
 * Keeps title, supporting copy, and primary actions aligned.
 */
export const SectionHeader = ({
  icon: Icon,
  title,
  description,
  badge,
  actions,
  iconClassName = "text-lime",
}: Props) => (
  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-surface-2 ${iconClassName}`}
        >
          <Icon className="h-4 w-4 shrink-0" />
        </div>
        <h1 className="font-inter-tight min-w-0 text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          {title}
        </h1>
        {badge && (
          <span className="ml-1 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-background px-2 py-0.5 font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

type DashOption = { value: string; label: string };
type DashOptionGroup = { label: string; options: DashOption[] };

interface DashSelectProps {
  value: string;
  onValueChange: (v: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  size?: "sm" | "md";
  options?: DashOption[];
  groups?: DashOptionGroup[];
  disabled?: boolean;
}

export const DashSelect = ({
  value,
  onValueChange,
  placeholder,
  ariaLabel,
  className,
  size = "sm",
  options,
  groups,
  disabled,
}: DashSelectProps) => {
  const triggerCls =
    size === "sm"
      ? "h-9 rounded-lg border-border/60 bg-background px-3 text-xs hover:border-border focus:ring-1 focus:ring-ring"
      : "h-10 rounded-lg border-border/60 bg-background px-3 text-sm hover:border-border focus:ring-1 focus:ring-ring";

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger aria-label={ariaLabel} className={cn(triggerCls, className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="rounded-lg border-border/60 bg-popover">
        {options &&
          options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-xs">
              {o.label}
            </SelectItem>
          ))}
        {groups &&
          groups.map((g) => (
            <SelectGroup key={g.label}>
              <SelectLabel className="font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {g.label}
              </SelectLabel>
              {g.options.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  {o.label}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
      </SelectContent>
    </Select>
  );
};

type StatProps = {
  label: string;
  value: string | number;
  icon: React.ElementType;
  tone?: "lime" | "amber" | "default" | "white";
  hint?: string | ReactNode;
};

export const StatCard = ({ label, value, icon: Icon, tone = "default", hint }: StatProps) => (
  <div className="dash-card rounded-2xl border border-white/5 bg-surface-1 p-4">
    <div className="flex items-center justify-between">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 ${
          tone === "white"
            ? "bg-white/10 text-white"
            : tone === "lime"
              ? "bg-lime/10 text-lime"
              : tone === "amber"
                ? "bg-warning/10 text-warning"
                : "bg-background text-muted-foreground"
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      {hint &&
        (typeof hint === "string" ? (
          <span className="font-jetbrains-mono uppercase text-[9px] text-muted-foreground">
            {hint}
          </span>
        ) : (
          hint
        ))}
    </div>
    <div className="mt-3 text-[11px] text-muted-foreground">{label}</div>
    <div className="font-inter-tight mt-0.5 text-xl font-semibold tabular-nums">{value}</div>
  </div>
);

export const Donut = ({
  slices,
}: {
  slices: { label: string; value: number; color: string }[];
}) => {
  const sorted = [...slices].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((s, x) => s + x.value, 0) || 1;
  const radius = 62;
  const thickness = 20;
  const inner = radius - thickness;
  const cx = 80;
  const cy = 80;
  const polar = (angle: number, r: number) => {
    const a = ((angle - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  };
  let cumulative = 0;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <svg width={168} height={168} viewBox="0 0 160 160" className="shrink-0">
        {/* Background track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius - thickness / 2}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={thickness}
        />
        {/* Segments */}
        {sorted.map((s, i) => {
          const startAngle = (cumulative / total) * 360;
          // eslint-disable-next-line react-hooks/immutability
          cumulative += s.value;
          const endAngle = (cumulative / total) * 360;
          const large = endAngle - startAngle > 180 ? 1 : 0;
          const [x1, y1] = polar(startAngle, radius);
          const [x2, y2] = polar(endAngle, radius);
          const [xi1, yi1] = polar(endAngle, inner);
          const [xi2, yi2] = polar(startAngle, inner);
          const d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${inner} ${inner} 0 ${large} 0 ${xi2} ${yi2} Z`;
          return <path key={i} d={d} fill={s.color} />;
        })}
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          className="fill-foreground"
          style={{ fontSize: 20, fontWeight: 700 }}
        >
          {total.toLocaleString()}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          className="fill-muted-foreground"
          style={{ fontSize: 8, letterSpacing: 1.5 }}
        >
          TOTAL VISITS
        </text>
      </svg>

      <div className="w-full flex-1 space-y-3.5">
        {sorted.map((s) => {
          const pct = Math.round((s.value / total) * 100);
          return (
            <div key={s.label} className="w-full">
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: s.color }}
                  />
                  <span className="truncate text-sm font-medium text-foreground">{s.label}</span>
                </span>
                <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
                  <span className="text-sm font-semibold text-foreground">{pct}%</span>
                  <span className="text-xs text-muted-foreground">{s.value.toLocaleString()}</span>
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: s.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Lives in lib so server components can use it too; re-exported here because
// every dashboard screen already imports it from this barrel.
export { timeAgo } from "@/lib/utils";

export const OrderKpi = ({
  icon: Icon,
  label,
  value,
  trend,
  trendUp,
  tone = "default",
  pulse,
  sparkline,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  trend: string;
  trendUp?: boolean;
  tone?: "default" | "white";
  pulse?: boolean;
  sparkline?: number[];
}) => (
  <div className="dash-card group relative overflow-hidden rounded-2xl border border-white/5 bg-surface-1 p-4 transition hover:border-white/10">
    <div className="flex items-center justify-between">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 ${tone === "white" ? "bg-white/10 text-white" : "bg-background text-muted-foreground"} ${pulse ? "animate-lime-pulse" : ""}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      {trend && (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-jetbrains-mono uppercase ${trendUp ? "bg-success/10 text-success" : "bg-white/5 text-muted-foreground"}`}
        >
          {trendUp && <TrendingUp className="h-2.5 w-2.5" />} {trend}
        </span>
      )}
    </div>
    <div className="mt-3 text-[11px] text-muted-foreground">{label}</div>
    <div className="mt-0.5 font-inter-tight text-xl font-semibold tabular-nums">{value}</div>
    {sparkline && (
      <div className="mt-2 h-8 opacity-70">
        <Sparkline points={sparkline} stroke="#ffffff" fill="rgba(255,255,255,0.08)" height={32} />
      </div>
    )}
  </div>
);
