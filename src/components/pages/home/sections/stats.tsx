import { Reveal } from "@/components//ui/ui-kit/Reveal";
import { cn } from "@/lib/utils";

export const Stats = () => {
  const stats = [
    { value: "€0", label: "comossion on every reservation", lime: true },
    { value: "10 min", label: "from sign up to go live", lime: false },
    { value: "24/7", label: "online bookings accepted", lime: false },
    { value: "100%", label: "of every sale is for you", lime: false },
  ];
  return (
    <section className="border-y border-foreground/5">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-10 px-6 py-16 lg:grid-cols-4 lg:px-8">
        {stats.map((s, i) => (
          <Reveal
            key={s.label}
            delay={i * 80}
            className={cn("px-2 lg:px-6", i > 0 && "lg:border-l lg:border-foreground/5")}
          >
            <div
              className={cn(
                "font-inter-tight text-4xl font-bold tracking-tight sm:text-5xl",
                s.lime ? "text-white" : "text-foreground",
              )}
            >
              {s.value}
            </div>
            <div className="mt-2 max-w-50 text-xs text-muted-foreground">{s.label}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
};
