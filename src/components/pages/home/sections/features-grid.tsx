"use client";
import { SectionTag } from "@/components/ui/ui-kit/Eyebrow";
import { Reveal } from "@/components/ui/ui-kit/Reveal";
import { RichHeadline } from "@/components/ui/ui-kit/RichHeadline";
import { cn } from "@/lib/utils";
import { BarChart3, CalendarCheck, Globe2, LayoutGrid, QrCode, Star } from "lucide-react";

const iconMap = {
  menu: LayoutGrid,
  calendar: CalendarCheck,
  qr: QrCode,
  analytics: BarChart3,
  star: Star,
  globe: Globe2,
} as const;

const AvailabilityVisual = () => (
  <div className="flex items-center justify-between rounded-3xl bg-foreground/6 px-3 py-2 font-jetbrains-mono text-[11px]">
    <span className="text-muted-foreground">
      TAGLIATELLE AL RAGÙ
      <span className="ml-2 text-foreground">€18 · 2 allergens · 3 add-ons</span>
    </span>
    <span className="ml-3 text-white">Live</span>
  </div>
);

const TimeslotsVisual = () => {
  const slots = ["19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"];
  const taken = [1, 3, 4];
  return (
    <div className="flex items-center gap-1.5">
      {slots.map((t, i) => (
        <div
          key={t}
          className={cn(
            "flex h-6 flex-1 items-center justify-center rounded-full font-jetbrains-mono text-[9px]",
            taken.includes(i)
              ? "bg-white text-primary-foreground"
              : "bg-foreground/5 text-muted-foreground",
          )}
        >
          {t}
        </div>
      ))}
    </div>
  );
};

const QrVisual = () => {
  // deterministic 7x7 QR-like pattern
  const pattern = [
    1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0,
    0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1,
  ];
  return (
    <div className="flex items-center justify-between">
      <div className="grid grid-cols-7 gap-0.5">
        {pattern.map((v, i) => (
          <div key={i} className={cn("h-2 w-2", v ? "bg-foreground" : "bg-transparent")} />
        ))}
      </div>
      <div className="text-right font-jetbrains-mono text-[10px]">
        <div className="text-muted-foreground">Table 14</div>
        <div className="text-white">412 scans</div>
      </div>
    </div>
  );
};

const BarsVisual = () => {
  const data = [25, 40, 30, 55, 35, 78, 45, 30, 50, 38, 28, 42];
  const whiteIdx = 5;
  return (
    <div>
      <div className="flex h-16 items-end gap-1">
        {data.map((h, i) => (
          <div
            key={i}
            className={cn("flex-1 rounded-full", i === whiteIdx ? "bg-white" : "bg-foreground/10")}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between font-jetbrains-mono text-[10px] text-muted-foreground">
        <span>MON</span>
        <span>SUN</span>
      </div>
    </div>
  );
};

const ReviewsVisual = () => (
  <div>
    <div className="flex items-center gap-1.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-3 w-3 fill-white text-white" />
      ))}
      <span className="ml-1 font-jetbrains-mono text-[10px] text-muted-foreground">
        4.9 · 1,284 reviews
      </span>
    </div>
    <p className="mt-2 text-[11px] italic text-muted-foreground">
      &quot;Best ragù in Brera. The QR menu in English was a delight.&quot;
    </p>
  </div>
);

const OrderFlowVisual = () => {
  const codes = ["NEW", "PREPARING", "READY", "DELIVERED"];
  const active = "PREPARING";
  return (
    <div className="flex flex-wrap gap-1.5">
      {codes.map((c) => (
        <span
          key={c}
          className={cn(
            "rounded-full border px-2 py-0.5 font-jetbrains-mono text-[10px]",
            c === active
              ? "border-white/40 bg-white/10 text-white"
              : "border-foreground/10 text-muted-foreground",
          )}
        >
          {c}
        </span>
      ))}
      <span className="rounded-full border border-foreground/10 px-2 py-0.5 font-jetbrains-mono text-[10px] text-muted-foreground">
        +21
      </span>
    </div>
  );
};

const visualMap = {
  availability: AvailabilityVisual,
  timeslots: TimeslotsVisual,
  qr: QrVisual,
  bars: BarsVisual,
  reviews: ReviewsVisual,
  orderflow: OrderFlowVisual,
} as const;

export const FeatureGrid = () => {
  return (
    <section id="features" className="relative">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
        <div className="mb-14 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <SectionTag number={"01"} label={"What's inside"} />
            <h2 className="font-inter-tight mt-5 text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-[56px]">
              <RichHeadline
                tokens={[
                  { plain: "One link. Everything " },
                  { white: "your restaurant " },
                  { plain: "needs." },
                ]}
              />
            </h2>
          </div>
          <p className="text-base leading-relaxed text-muted-foreground">
            From the moment a guest discovers your restaurant to the moment they leave. Dineri
            manages everything in between. Reservations, host management, food ordering and your
            public page. All connected. Zero commission.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              num: "01",
              iconKey: "menu",
              title: "Menu",
              desc: "Update your menu yourself. Change dishes, prices and photos in seconds, from your phone, anywhere. No technical skills needed",
              visualKey: "availability",
            },
            {
              num: "02",
              iconKey: "calendar",
              title: "Reservations",
              desc: "Every missed call is a missed table. Every no-show is money gone. Dineri fixes both. Zero comossion, guests show up or you get paid",
              visualKey: "timeslots",
            },
            {
              num: "03",
              iconKey: "qr",
              title: "QR Code",
              desc: "Generate per-table QR codes that open your menu instantly. Track scans by seat.",
              visualKey: "qr",
            },
            {
              num: "04",
              iconKey: "analytics",
              title: "Analytics",
              desc: "Know what guests view, scan, click and book. Cohort by source - Instagram vs Google vs table QR.",
              visualKey: "bars",
            },
            {
              num: "05",
              iconKey: "star",
              title: "Reviews",
              desc: "Aggregate Google, Tripadvisor and TheFork reviews. Auto-reply with AI in your tone.",
              visualKey: "reviews",
            },
            {
              num: "06",
              iconKey: "globe",
              title: "Food ordering",
              desc: "Take orders straight from the menu and get paid through your own Stripe account. Track every order to the door.",
              visualKey: "orderflow",
            },
          ].map((item, idx) => {
            const Icon = iconMap[item.iconKey as keyof typeof iconMap];
            const Visual = visualMap[item.visualKey as keyof typeof visualMap];
            return (
              <Reveal key={item.num} as="article" delay={idx * 70}>
                <div className="group hover-lift relative flex h-full flex-col rounded-2xl border border-foreground/5 bg-surface-1 p-6 hover:border-foreground/10 hover:bg-surface-2">
                  <div className="mb-10 flex items-start justify-between">
                    <span className="font-jetbrains-mono text-[11px] text-muted-foreground">
                      {item.num}
                    </span>
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  <h3 className="font-inter-tight text-xl font-semibold tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>

                  <div className="mt-6 pt-2">
                    <Visual />
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};
