export const SettingsGroup = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-3">
    <div className="flex items-baseline justify-between gap-3 border-b border-white/5 pb-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-[11px] text-muted-foreground">{description}</p>
    </div>
    {children}
  </div>
);

export const SettingCard = ({
  icon: Icon,
  title,
  description,
  tone = "default",
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  tone?: "white" | "danger" | "info" | "amber" | "default";
  children: React.ReactNode;
}) => {
  // Setting icons are uniformly white; `tone` still drives the card outline below.
  const toneCls = "border-white/30 bg-white/10 text-white";
  const cardBorder = tone === "danger" ? "border-danger/20" : "border-white/5";
  return (
    <div className={`dash-card rounded-2xl border ${cardBorder} bg-surface-1 p-4 sm:p-5`}>
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${toneCls}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold">{title}</h4>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          <div className="mt-3">{children}</div>
        </div>
      </div>
    </div>
  );
};

export const Toggle = ({
  checked,
  onChange,
  tone = "white",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  tone?: "white" | "danger";
}) => (
  <button
    role="switch"
    type="button"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full border transition ${
      checked
        ? tone === "danger"
          ? "border-danger/40 bg-danger"
          : "border-white/40 bg-white"
        : "border-white/10 bg-background"
    }`}
  >
    <span
      className={`inline-block h-4 w-4 rounded-full bg-background shadow transition-transform ${
        checked ? "translate-x-6" : "translate-x-1"
      } ${checked ? "bg-background" : "bg-muted-foreground"}`}
    />
  </button>
);
