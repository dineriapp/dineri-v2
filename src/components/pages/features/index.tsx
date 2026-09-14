import { PageHeader } from "@/components/shared/page-header";
import { PillButton } from "@/components/ui/ui-kit/PillButton";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

const features = [
  {
    num: "01",
    eyebrow: "Reservations",
    title: "No more no-shows",
    desc: "Let guests book a table directly with automatic confirmations and optional prepayment. Always organized, no hassle.",
    image: "/images/feature-noshows.jpg",
    bullets: [
      "Auto confirmations & reminders",
      "Optional prepayment & deposits",
      "Waitlist + table mapping",
    ],
  },
  {
    num: "02",
    eyebrow: "Orders",
    title: "Order system",
    desc: "Keep 100% of your revenue. Direct orders, zero commissions. Your orders. Your money.",
    image: "/images/feature-orders.jpg",
    bullets: [
      "0% commission, ever",
      "Pickup, delivery & dine-in",
      "Stripe & local payment methods",
    ],
  },
  {
    num: "03",
    eyebrow: "QR codes",
    title: "Track every scan",
    desc: "Generate personalized QR codes and track every scan in real time. See which codes perform best and optimize your marketing strategy.",
    image: "/images/feature-qr.jpg",
    bullets: [
      "Per-table & per-campaign QR",
      "Real-time scan analytics",
      "Branded, downloadable PDFs",
    ],
  },
  {
    num: "04",
    eyebrow: "FAQ",
    title: "FAQ in one click",
    desc: "Easily add a FAQ section to your page. Answer your guests' most common questions and cut down on unnecessary calls.",
    image: "/images/feature-faq.jpg",
    bullets: ["Pre-built question templates", "Multilingual answers", "Reduces inbound calls 40%+"],
  },
  {
    num: "05",
    eyebrow: "Bookings",
    title: "Reservation system",
    desc: "Let guests book a table directly through your page. Automatic confirmation and cancellation emails, prepayment options and review requests.",
    image: "/images/feature-reservations.jpg",
    bullets: ["Email + SMS workflows", "Post-visit review requests", "Sync with Google Calendar"],
  },
  {
    num: "06",
    eyebrow: "Menu",
    title: "Digital menu",
    desc: "Put your menu online with categories, prices and allergen information. Update it in real time from your dashboard. Simple, fast and always up to date.",
    image: "/images/feature-menu.jpg",
    bullets: [
      "Allergens, modifiers & add-ons",
      "Live availability toggles",
      "Drag-and-drop builder",
    ],
  },
] as const;

const FeaturesPage = () => {
  return (
    <>
      <PageHeader
        number="02"
        label="Features"
        headline={[{ plain: "Your restaurant's " }, { lime: "digital home." }]}
        description="Showcase your menu, attract new guests and manage everything from one powerful platform, built for restaurants that want to grow."
      />

      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          <div className="space-y-20 lg:space-y-28">
            {features.map((f, i) => {
              const reverse = i % 2 === 1;
              return (
                <article key={f.num} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                  {/* Copy */}
                  <div className={cn(reverse && "lg:order-2")}>
                    <div className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[11px] text-muted-foreground">
                      /{f.num} - {f.eyebrow}
                    </div>
                    <h2 className="font-inter-tight mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                      {f.title}
                    </h2>
                    <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                      {f.desc}
                    </p>
                    <ul className="mt-7 space-y-3">
                      {f.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-3 text-sm text-foreground/90">
                          <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-lime" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Visual */}
                  <div className={cn("relative", reverse && "lg:order-1")}>
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-lime/15 blur-3xl"
                    />
                    <div className="relative aspect-5/4 overflow-hidden rounded-[24px] border border-white/10 bg-surface-1 shadow-[0_30px_80px_-20px_hsl(var(--lime)/0.15)]">
                      <Image
                        src={f.image}
                        alt={`${f.title} - Dineri preview`}
                        loading="lazy"
                        width={1280}
                        height={1024}
                        className="absolute inset-0 h-full w-full object-cover grayscale"
                      />

                      {/* corner ticks */}
                      <span className="absolute left-3 top-3 h-2.5 w-2.5 border-l border-t border-lime/40" />
                      <span className="absolute right-3 top-3 h-2.5 w-2.5 border-r border-t border-lime/40" />
                      <span className="absolute bottom-3 left-3 h-2.5 w-2.5 border-b border-l border-lime/40" />
                      <span className="absolute bottom-3 right-3 h-2.5 w-2.5 border-b border-r border-lime/40" />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-24 flex flex-col items-center gap-4 rounded-3xl border border-white/5 bg-surface-1 px-8 py-14 text-center">
            <div className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[11px] text-lime">
              READY WHEN YOU ARE
            </div>
            <h3 className="font-inter-tight max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              All of this. Live by tonight.
            </h3>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link href="/sign-up">
                <PillButton size="lg">Start free - no card</PillButton>
              </Link>
              <Link href="/demo">
                <PillButton size="lg" variant="outline">
                  Request a demo
                </PillButton>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default FeaturesPage;
