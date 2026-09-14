import { cn } from "@/lib/utils";
import { input_class } from "./utils";

export const Card = ({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: React.ElementType;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-white/10 bg-surface-1 p-4 sm:p-5">
    <div className="mb-4 flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-lime/30 bg-lime/10 text-lime">
        <Icon className="h-4 w-4 shrink-0" />
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
    </div>
    {children}
  </div>
);

export const Field = ({
  label,
  full,
  children,
  className,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
  className?: string;
}) => (
  <label className={cn(`block ${full ? "md:col-span-2" : ""}`, className)}>
    <Label>{label}</Label>
    <div className="mt-1.5">{children}</div>
  </label>
);

export const Label = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={cn(
      "font-jetbrains-mono uppercase text-[10px] tracking-wider text-muted-foreground",
      className,
    )}
  >
    {String(children).toUpperCase()}
  </span>
);

export const ColorInput = (label: string, value: string, onChange: (value: string) => void) => (
  <Field label={label}>
    <div className="flex gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-12"
      />

      <input className={input_class} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  </Field>
);
