import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Data } from "@/lib/types/onboarding";

type Props = {
  update: <K extends keyof Data>(k: K, v: Data[K]) => void;
  data: Data;
};

const MenuOptions = ({ data, update }: Props) => {
  return (
    <>
      <div className="space-y-2">
        <Label className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
          Roughly how many items?
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { v: "small", label: "1–20" },
              { v: "medium", label: "20–60" },
              { v: "large", label: "60+" },
            ] as const
          ).map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => update("menuSize", o.v)}
              className={`rounded-xl border px-3 py-3 text-sm transition ${
                data.menuSize === o.v
                  ? "border-lime bg-lime/10 text-foreground"
                  : "border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
          How would you like to add your menu?
        </Label>
        <div className="space-y-2">
          {(
            [
              {
                v: "manual",
                title: "Add manually",
                desc: "Use our builder - fastest for small menus.",
              },
              // { v: "pdf", title: "Upload a PDF", desc: "We'll extract items for you (Pro)." },
              // { v: "link", title: "Import from URL", desc: "Paste a link from your current site." },
            ] as const
          ).map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => update("importMethod", o.v)}
              className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
                data.importMethod === o.v
                  ? "border-lime bg-lime/5"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              <div
                className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${
                  data.importMethod === o.v ? "border-lime bg-lime" : "border-white/20"
                }`}
              />
              <div>
                <div className="text-sm font-medium">{o.title}</div>
                <div className="text-xs text-muted-foreground">{o.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
          What&apos;s your main goal? (optional)
        </Label>
        <Input
          className="h-11 w-full "
          placeholder="Drive more reservations on weekends"
          value={data.goal}
          onChange={(e) => update("goal", e.target.value)}
        />
      </div>
    </>
  );
};

export default MenuOptions;
