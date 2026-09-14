import { ShieldCheck } from "lucide-react";

export const Callout = ({
  tone = "info",
  children,
}: {
  tone?: "info" | "warn";
  children: React.ReactNode;
}) => (
  <div
    className={`flex gap-3 rounded-xl border p-3 text-xs ${
      tone === "warn"
        ? "border-warning/20 bg-warning/5 text-warning"
        : "border-white/20 bg-white/5 text-muted-foreground"
    }`}
  >
    <ShieldCheck
      className={`h-4 w-4 shrink-0 ${tone === "warn" ? "text-warning" : "text-white"}`}
    />
    <div>{children}</div>
  </div>
);
