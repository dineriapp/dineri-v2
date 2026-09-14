import { cn } from "@/lib/utils";

interface PhoneMockupProps {
  className?: string;
}

export const PhoneMockup = ({ className }: PhoneMockupProps) => {
  return (
    <div className={cn("relative w-full max-w-72.5", className)}>
      {/* Floating review chip - top */}
      <div className="absolute -top-4 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-surface-1/90 px-3 py-1.5 text-[11px] text-muted-foreground shadow-elevated backdrop-blur">
        <span className="text-lime">★</span> 4.9 · 18 reviews this week
      </div>

      {/* Floating annotation - left of phone */}
      <div className="absolute right-full top-32 z-20 mr-3 hidden xl:block">
        <div className="flex items-center gap-2">
          <div className="h-px w-10 bg-lime/40" />
          <div className="font-jetbrains-mono uppercase tracking-[0.12rem] whitespace-nowrap text-[10px] text-lime">
            +312 menu views today
          </div>
        </div>
      </div>

      {/* Phone frame */}
      <div className="relative mx-auto w-full rounded-[42px] border border-white/10 bg-linear-to-b from-white/5 to-transparent p-2 shadow-elevated">
        <div className="rounded-[36px] bg-white z-20! relative p-4 text-neutral-900">
          {/* Status bar */}
          <div className="mb-3 flex items-center justify-between text-[10px] text-neutral-500">
            <span className="font-medium">9:41</span>
            <div className="flex gap-1">
              <div className="h-1 w-1 rounded-full bg-neutral-400" />
              <div className="h-1 w-1 rounded-full bg-neutral-400" />
              <div className="h-1 w-1 rounded-full bg-neutral-400" />
            </div>
          </div>

          {/* Restaurant header */}
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200 text-xs font-bold">
              TM
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-[13px] font-semibold">
                Trattoria Milano
                {true && (
                  <svg className="h-3 w-3 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L9.5 5.5L5.5 5L5 9L2 12L5 15L5.5 19L9.5 18.5L12 22L14.5 18.5L18.5 19L19 15L22 12L19 9L18.5 5L14.5 5.5L12 2Z" />
                  </svg>
                )}
              </div>
              <div className="text-[10px] text-neutral-500">Via Brera 12 · Milan</div>
              <div className="text-[10px] text-neutral-500">Open · closes 23:30</div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="mb-3 flex gap-1.5">
            {["Reserve", "Directions"].map((a, i) => (
              <button
                key={a}
                className={cn(
                  "flex-1 rounded-full py-1.5 text-[10px] font-medium",
                  i === 0 ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-900",
                )}
              >
                {a}
              </button>
            ))}
            <button className="rounded-full bg-neutral-100 px-2.5 py-1.5 text-[10px]">♡</button>
          </div>

          {/* Tabs */}
          <div className="mb-2.5 flex gap-1 border-b border-neutral-100 pb-1.5 text-[10px]">
            {["Menu", "Reviews", "Hours", "Gift"].map((t) => (
              <span
                key={t}
                className={cn(
                  "rounded-full px-2.5 py-1",
                  t === "Menu" ? "bg-neutral-900 text-white" : "text-neutral-500",
                )}
              >
                {t}
              </span>
            ))}
          </div>

          {/* Menu list */}
          <div className="space-y-1.5">
            {[
              {
                name: "Tagliatelle al ragù",
                desc: "Slow-braised beef, parmigiano 24m",
                price: "€18",
              },
              {
                name: "Risotto allo zafferano",
                desc: "Carnaroli, saffron, bone marrow",
                price: "€22",
              },
              {
                name: "Vitello tonnato",
                desc: "Veal, tuna emulsion, capers",
                price: "€16",
              },
              {
                name: "Tiramisù della casa",
                desc: "Mascarpone, espresso, cocoa",
                price: "€9",
              },
            ].map((item) => (
              <div
                key={item.name}
                className="flex items-start justify-between rounded-lg bg-neutral-50 p-2"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="text-[11px] font-medium leading-tight">{item.name}</div>
                  <div className="truncate text-[9px] text-neutral-500">{item.desc}</div>
                </div>
                <div className="text-[11px] font-semibold">{item.price}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-neutral-900 py-2.5 text-[11px] font-medium text-white">
            Book a table →
          </button>
        </div>
      </div>

      {/* Bottom right annotation */}
      <div className="absolute -bottom-3 -right-20 z-20 hidden xl:block">
        <div className="flex items-center gap-2">
          <div className="font-jetbrains-mono uppercase tracking-[0.12rem] whitespace-nowrap text-[10px] text-muted-foreground">
            QR scan · Table 14
          </div>
          <div className="h-px w-10 bg-white/20" />
        </div>
      </div>
    </div>
  );
};
