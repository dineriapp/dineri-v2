import { PageHeader } from "@/components/shared/page-header";
import { PillButton } from "@/components/ui/ui-kit/PillButton";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

const features = [
  {
    num: "01",
    eyebrow: "No-show protection",
    title: "No shows? Not anymore",
    desc: "Every no-show is money you never see. Dineri protects your revenue with automatic reminders and optional deposit so guests show up or you get paid.",
    image: "/images/feature-noshows.jpg",
    bullets: [
      "No-shows cost you money. Reminders fix that",
      "Optional deposit. Guests commit or you get paid",
      "No middleman. Guests book directly",
    ],
  },
  {
    num: "02",
    eyebrow: "Orders",
    title: "Delivery platforms take 30%. Dineri takes zero",
    desc: "Accept takeaway and delivery orders directly through your Dineri page. No commission. Every order goes straight to your bank account.",
    image: "/images/feature-orders.jpg",
    bullets: [
      "Set up in minutes. Start taking orders today",
      "Pickup and delivery. Fully includded",
      "Guests order in seconds. No app needed",
    ],
  },
  {
    num: "03",
    eyebrow: "QR codes",
    title: "One scan, instant access",
    desc: "Create a QR code in seconds. Link it to your menu, reservation page or any URL you want. Track how many times it gets scanned and see what actually works.",
    image: "/images/feature-qr.jpg",
    bullets: [
      "Create and link to anything in seconds",
      "Track every scan. See what works",
      "Use it on flyers, windows or social media",
    ],
  },
  {
    num: "04",
    eyebrow: "FAQ",
    title: "Stop answering the same questions every day",
    desc: "Add a FAQ section to your Dineri page in seconds. Answer your guests most common questions once and let your page do the talking.",
    image: "/images/feature-faq.jpg",
    bullets: [
      "Do I need a reservation? Are you dog friendly? Answered once",
      "Less time on the phone. More time for your guests",
      "Add, edit or remove questions anytime",
    ],
  },
  {
    num: "05",
    eyebrow: "Reservations",
    title: "Full tables. Every night",
    desc: "Guests book directly through your Dineri page. 24/7, zero commission and fully automated. Confirmations, cancellations, reminders and refunds all handled for you.",
    image: "/images/feature-reservations.jpg",
    bullets: [
      "24/7 bookings. Never miss a reservation",
      "Zero commission. Every booking is yours",
      "Automatic confirmations, reminders en refunds",
    ],
  },
  {
    num: "06",
    eyebrow: "Menu",
    title: "Always up to date",
    desc: "Update your menu yourself. Change or add dishes, prices and photos in seconds from your phone. No technical skills needed.",
    image: "/images/feature-menu.jpg",
    bullets: [
      "Add dishes, prices, photos and allergens",
      "Changes go live instantly",
      "Works perfectly on any phone, where ever you are",
    ],
  },
] as const;

const FeaturesPage = () => {
  return (
    <>
      <PageHeader
        number="02"
        label="Features"
        headline={[{ plain: "Everything your restaurant needs. " }, { lime: "Nothing you don't." }]}
        description="One platform that handles reservations, orders, host management and your public page. Zero commission. Always."
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
              GET STARTED
            </div>
            <h3 className="font-inter-tight max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              Your restaurant. Live tonight
            </h3>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link href="/sign-up">
                <PillButton size="lg">Start your free month</PillButton>
              </Link>
              <Link href="/demo">
                <PillButton size="lg" variant="outline">
                  Book a demo
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
