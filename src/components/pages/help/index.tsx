"use client";
import { PageHeader } from "@/components/shared/page-header";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  HelpCircle,
  Image as ImageIcon,
  LifeBuoy,
  Link2,
  MessageSquare,
  Package,
  QrCode,
  Sparkles,
  Trophy,
  UtensilsCrossed,
  Zap,
} from "lucide-react";
import { SupportTicketDialog } from "./_components/support-ticket-dialog";
import { useEffect, useState } from "react";
import Link from "next/link";
import { venueDisplayUrl } from "@/lib/venue-url";

type Section = {
  id: string;
  number: string;
  label: string;
  title: string;
  intro?: string;
};

const sidebar = [
  {
    group: "Introduction",
    items: [
      { id: "why", label: "Why Dineri?" },
      { id: "who", label: "Who is Dineri for?" },
      { id: "key-points", label: "Key things to know" },
    ],
  },
  {
    group: "What's new",
    items: [
      { id: "new-features", label: "New features" },
      { id: "improvements", label: "Improvements" },
      { id: "coming-soon", label: "Coming soon" },
    ],
  },
  {
    group: "Features",
    items: [
      { id: "analytics", label: "Analytics" },
      { id: "orders", label: "Orders" },
      { id: "links", label: "Links" },
      { id: "menu", label: "Menu" },
      { id: "events", label: "Events" },
      { id: "faq", label: "FAQ" },
      { id: "popups", label: "Popups" },
      { id: "qr-codes", label: "QR codes" },
      { id: "success-story", label: "Success story" },
      { id: "gallery", label: "Gallery" },
    ],
  },
  {
    group: "Contact",
    items: [{ id: "support", label: "Get help" }],
  },
];

const reasons = [
  {
    title: "Built for your guests",
    desc: "A fast, beautiful mobile page that answers every question your guest has. Menu, location, hours and a way to book.",
  },
  {
    title: "No technical skills needed",
    desc: "If you can use Instagram, you can use Dineri. Set up your restaurant in 10 minutes, we handle everything else.",
  },
  {
    title: "Know what's working",
    desc: "See how many guests visit your page, what they click and where they come from. Make better decisions with real data.",
  },
  {
    title: "Zero commission",
    desc: "Delivery platforms take up to 30%. Reservation systems charge per booking. Dineri takes zero. Every euro stays with you.",
  },
  {
    title: "One platform",
    desc: "Everything your restaurant needs in one place. No switching between tools, no separate subscriptions, no chaos.",
  },
];

const audiences = [
  {
    name: "Independent restaurants",
    desc: "From small bistros to busy beach clubs, Dineri gives you everything you need to fill tables and protect your revenue.",
  },
  {
    name: "Tourist destination restaurants",
    desc: "Operating in Ibiza, Tenerife, Sardinia or the Caribbean? Dineri is built for restaurants that serve international guests who book online.",
  },
  {
    name: "Restaurants with events",
    desc: "Wine nights, chef's tables or special dinners, sell tickets directly through your Dineri page. Zero commission.",
  },
  {
    name: "Restaurants tired of no-shows",
    desc: "Every no-show costs you money. Dineri's built-in no-show protection means guests show up or you get paid.",
  },
  {
    name: "Restaurants accepting food orders",
    desc: "Take takeaway and delivery orders directly through your Dineri page. No third-party platform, no commission. Every order goes straight to your bank account.",
  },
];

const keyPoints = [
  "One platform — reservations, orders, your public page and no-show protection. All connected.",
  "Live in 10 minutes — set up your restaurant and start taking bookings today.",
  "No technical skills needed — if you can use Instagram, you can use Dineri.",
  "Zero commission — on reservations and orders. Every euro stays with you.",
  "Mobile-first — your page works perfectly on any phone, anywhere in the world.",
  "Real-time updates — change your menu, prices or photos and they go live instantly.",
  "Real-time updates - changes are reflected instantly.",
  "Your data is yours — fully GDPR compliant. We never sell or share your data.",
  "Cancel anytime — no long-term contracts. No questions asked.",
];

const newFeatures = [
  {
    title: "Design Studio",
    desc: "Customize your Dineri page to match your restaurant's brand. Choose your colors, fonts and layout and see the changes live before you publish.",
  },
  {
    title: "Email customization",
    desc: "Fully customize your automated emails. Confirmation emails, reminders and cancellation messages all in your own tone and style.",
  },
];

const improvements = [
  "More typography options. More font choices to better match your restaurant's brand.",
  "Bug fixes. Minor issues resolved for a smoother experience.",
];

const comingSoon = [
  {
    title: "Guest profiles & loyalty",
    desc: "Reward your most loyal guests and build a database of returning visitors.",
  },
  {
    title: "POS integration",
    desc: "Connect Dineri with your existing POS system. Included in your current plan at no extra cost.",
  },
  {
    title: "Campaign manager",
    desc: "Create and manage your own Meta ad campaigns directly from your Dineri dashboard and target the right guests at the right time.",
  },
];

const HelpPage = () => {
  return (
    <>
      <PageHeader
        number="08"
        label="Help Center"
        headline={[{ plain: "Everything you need to " }, { lime: "run Dineri" }]}
        description="This guide walks you through every feature from setting up your public page to managing reservations, orders and no-show protection."
        richClassName="max-w-4xl"
      />
      <section className="relative">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16 lg:px-8 lg:py-24">
          <Sidebar />

          <div className="min-w-0 space-y-24">
            {/* INTRODUCTION ------------------------------------------- */}
            <article id="why" className="scroll-mt-24">
              <SectionHeading id="why" number="01" label="Introduction" title="Why Dineri?" />
              <p className="text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                Building a restaurant website can be expensive, time-consuming and often
                unnecessary. Your guests don't need a fancy website, they need your menu, your
                location and a way to book.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {reasons.map((r) => (
                  <div
                    key={r.title}
                    className="rounded-2xl border border-foreground/5 bg-surface-1 p-6"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime/10 text-lime">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <h3 className="font-inter-tight mt-5 text-base font-semibold tracking-tight">
                      {r.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.desc}</p>
                  </div>
                ))}
              </div>
            </article>

            <article id="who" className="scroll-mt-24">
              <SectionHeading
                id="who"
                number="01"
                label="Introduction"
                title="Who is Dineri for?"
              />
              <ul className="grid gap-3 sm:grid-cols-2">
                {audiences.map((a) => (
                  <li
                    key={a.name}
                    className="rounded-2xl border border-foreground/5 bg-surface-1 p-6"
                  >
                    <h3 className="font-inter-tight text-base font-semibold tracking-tight">
                      {a.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.desc}</p>
                  </li>
                ))}
              </ul>
            </article>

            <article id="key-points" className="scroll-mt-24">
              <SectionHeading
                id="key-points"
                number="01"
                label="Introduction"
                title="Key things to know"
              />
              <BulletList items={keyPoints} />
            </article>

            {/* WHAT'S NEW --------------------------------------------- */}
            <article id="new-features" className="scroll-mt-24">
              <SectionHeading
                id="new-features"
                number="02"
                label="What's new"
                title="New features"
              />
              <div className="grid gap-3 sm:grid-cols-3">
                {newFeatures.map((f) => (
                  <div
                    key={f.title}
                    className="rounded-2xl border border-foreground/5 bg-surface-1 p-6"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime/10 text-lime">
                      <Zap className="h-4 w-4" />
                    </div>
                    <h3 className="font-inter-tight mt-5 text-base font-semibold tracking-tight">
                      {f.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  </div>
                ))}
              </div>
            </article>

            <article id="improvements" className="scroll-mt-24">
              <SectionHeading
                id="improvements"
                number="02"
                label="What's new · September '26"
                title="Improvements"
              />
              <BulletList items={improvements} />
            </article>

            <article id="coming-soon" className="scroll-mt-24">
              <SectionHeading id="coming-soon" number="02" label="What's new" title="Coming soon" />
              <ul className="grid gap-3 sm:grid-cols-3">
                {comingSoon.map((c) => (
                  <li
                    key={c.title}
                    className="rounded-2xl border border-foreground/5 bg-surface-1 p-6"
                  >
                    <h3 className="font-inter-tight text-base font-semibold tracking-tight">
                      {c.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
                  </li>
                ))}
              </ul>
            </article>

            {/* FEATURES ----------------------------------------------- */}
            {features.map((f) => (
              <article key={f.id} id={f.id} className="scroll-mt-24">
                <header className="mb-6">
                  <div className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[11px] text-muted-foreground">
                    /{f.number} - Features · {f.title}
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lime/10 text-lime">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <h2 className="font-inter-tight text-2xl font-semibold tracking-tight sm:text-3xl">
                      {f.title}
                    </h2>
                  </div>
                  <p className="mt-5 max-w-3xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                    {f.intro}
                  </p>
                </header>

                <div className="rounded-2xl border border-foreground/5 bg-surface-1 p-6 sm:p-8">
                  {f.blocks.map((b) => (
                    <Block key={b.heading} heading={b.heading} type={b.type} items={b.items} />
                  ))}
                </div>
              </article>
            ))}

            {/* SUPPORT ------------------------------------------------ */}
            <article id="support" className="scroll-mt-24">
              <SectionHeading id="support" number="13" label="Support" title="Get help" />
              <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                Can't find what you're looking for? Reach out and we'll get back to you as soon as
                possible.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-foreground/5 bg-surface-1 p-6">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime/10 text-lime">
                    <LifeBuoy className="h-4 w-4" />
                  </div>
                  <h3 className="font-inter-tight mt-5 text-base font-semibold tracking-tight">
                    Already a Dineri customer?
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Log in to your dashboard and reach us directly via the in-app support for the
                    fastest response. No acces? You can send us an email as well.
                  </p>
                  <Link
                    href="mailto:info@dineri.app"
                    className="mt-5 inline-flex items-center gap-2 text-sm text-lime hover:underline"
                  >
                    info@dineri.app
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="rounded-2xl border border-foreground/5 bg-surface-1 p-6">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime/10 text-lime">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <h3 className="font-inter-tight mt-5 text-base font-semibold tracking-tight">
                    Submit a request
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Technical issue, billing question or feature request? Let us know and we'll take
                    care of it.
                  </p>
                  <div className="mt-5">
                    <SupportTicketDialog />
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </>
  );
};

export default HelpPage;

const features: {
  id: string;
  number: string;
  icon: typeof BarChart3;
  title: string;
  intro: string;
  blocks: {
    heading: string;
    type: "list" | "items";
    items: (string | { t: string; d: string })[];
  }[];
}[] = [
  {
    id: "analytics",
    number: "03",
    icon: BarChart3,
    title: "Analytics",
    intro:
      "Stop guessing. Dineri's analytics show you how guests find your page, what they click and where they come from. Make better decisions based on real data.",
    blocks: [
      {
        heading: "Key metrics",
        type: "items",
        items: [
          { t: "Page views", d: "Total number of times your Dineri page was visited." },
          { t: "Unique visitors", d: "The number of individual people who visited your page." },
          { t: "Visitors today", d: "How many times your Dineri page was visited." },
          { t: "Average visitors per day", d: "Your daily average over the selected period." },
          { t: "Peak day", d: "The day with the most visitors." },
          { t: "Top countries & cities", d: "Where your guests are coming from." },
          { t: "Traffic sources", d: "How guests find you, direct, social media or search." },
          { t: "Devices", d: "Whether guests visit on mobile or desktop." },
        ],
      },
      {
        heading: "Key benefits",
        type: "list",
        items: [
          "Understand where your guests come from. Country, city and traffic source all in one overview.",
          "Know your peak moments. See which days and times get the most visitors and plan accordingly.",
          "Mobile vs desktop. Understand how your guests browse and optimize your page for the right device.",
          "Track your growth. Compare periods and see if your page is gaining more visitors over time.",
        ],
      },
      {
        heading: "Tips",
        type: "list",
        items: [
          "Check your analytics every week to spot trends early.",
          "A sudden spike in visitors? Check if something you posted on social media drove the traffic.",
          "Most visitors on mobile? Make sure your page looks great on a phone.",
          "Share your Dineri page link more actively and watch your visitor numbers grow.",
        ],
      },
    ],
  },
  {
    id: "orders",
    number: "04",
    icon: Package,
    title: "Orders",
    intro:
      "Accept takeaway and delivery orders through your Dineri page. No third-party platform, no commission. Every order goes straight to your bank account.",
    blocks: [
      {
        heading: "How it works",
        type: "items",
        items: [
          {
            t: "Set up your menu",
            d: `Your menu lives at /menu (e.g. ${venueDisplayUrl("your-restaurant", "/menu")}). Add dishes, prices, photos and allergens from your dashboard. Changes go live instantly.`,
          },
          {
            t: "Connect your Stripe account",
            d: "Go to Settings → Stripe settings and enter your Stripe public key and secret key. Once connected, every payment goes directly to your bank account.",
          },
          {
            t: "Manage incoming orders",
            d: "Every order appears in your dashboard in real time. Move orders through the flow: New, Confirmed, Preparing, Ready, Delivered or Cancelled.",
          },
        ],
      },
      {
        heading: "Dashboard controls",
        type: "items",
        items: [
          {
            t: "Restaurant status",
            d: "Enable delivery, pickup or both. Set 'Disable Both' when you're not accepting orders.",
          },
          { t: "Delivery fee", d: "Configure the tax rate for your orders." },
          {
            t: "Tax percentage",
            d: "Auto-refresh every 2, 5 or 15 minutes. Perfect for a kitchen tablet.",
          },
          {
            t: "Refresh timer",
            d: "Auto-refresh every 2, 5 or 15 minutes. Perfect for a kitchen tablet.",
          },
          {
            t: "Order export",
            d: "Download your full order history for accounting in just one click.",
          },
        ],
      },
      {
        heading: "Imporant to know",
        type: "list",
        items: [
          "Stripe is required. Connect your Stripe account before enabling orders. Without Stripe, guests cannot complete their payment.",
          "Stripe transaction fees apply. Dineri charges zero commission but standard Stripe payment processing fees apply to every transaction.",
          "Customize your order emails. Go to Settings → Email Integration to customize your automated order emails",
          "When your restaurant status is set to Disable both, guests can still view your menu but prices are hidden and ordering is disabled.",
          "Guests can only place orders during the opening hours you have set in Settings. Outside these hours, ordering is automatically disabled.",
          "Every time you update an order status, your guest receives an automatic email notification. Keep your orders moving to keep your guests informed.",
        ],
      },
      {
        heading: "Tips",
        type: "list",
        items: [
          "Use high-quality photos for every dish. A great photo makes guests more likely to order.",
          "Check your restaurant status before service starts to make sure you're accepting orders.",
          "Use the refresh timer on a tablet in the kitchen for hands-free order updates.",
          "Export your order history monthly to keep your records organized.",
          "Guests can track their order status at dine.bio/your-restaurant/track-order. Add this link to your order confirmation email so guests can follow their order in real time.",
        ],
      },
    ],
  },
  {
    id: "links",
    number: "05",
    icon: Link2,
    title: "Links",
    intro:
      "Add all your important links to your Dineri page. Your menu, reservations, social media, website or anything else. Guests find everything in seconds.",
    blocks: [
      {
        heading: "How it works",
        type: "list",
        items: [
          "Click Add Link and enter a title and URL.",
          "Reorder links by dragging them into your preferred order.",
          "Save. Changes go live instantly.",
        ],
      },
      {
        heading: "Key benefits",
        type: "list",
        items: [
          "All your important links in one place. No more sending guests to multiple platforms.",
          "Fully customizable. Add titles, icons and reorder anytime.",
          "Instant updates. Changes go live the moment you save.",
        ],
      },
      {
        heading: "Tips",
        type: "list",
        items: [
          "Add your reservation link so guests can book directly from your page.",
          "Keep it short. Three to five links works best. Too many links overwhelms guests.",
          "Add your Instagram or Google Maps link for extra visibility.",
          "Check your analytics to see which links get the most clicks.",
        ],
      },
    ],
  },
  {
    id: "menu",
    number: "06",
    icon: UtensilsCrossed,
    title: "Menu",
    intro:
      "Create and update your menu in seconds. Add dishes, photos, prices and allergens all from your phone. Changes go live instantly.",
    blocks: [
      {
        heading: "How it works",
        type: "items",
        items: [
          {
            t: "Create categories",
            d: "Add categories like Starters, Main Courses and Sushi. Drag to reorder them anytime.",
          },
          {
            t: "Add menu items",
            d: "Click Add item under a category. Fill in the name, price, description and photo.",
          },
          {
            t: "Set dietary info and allergens",
            d: "Tag dishes as Vegetarian, Vegan, Halal or Gluten-free. Add allergen warnings for Nuts, Dairy, Gluten, Egg, Soy, Shellfish, Fish, Meat or Alcohol.",
          },
          {
            t: "Add-ons",
            d: "Add toppings, sides or sizes to upsell the dish.",
          },
          {
            t: "Set visibility",
            d: "Toggle Public visibility to show or hide individual dishes.",
          },
          {
            t: "Publish",
            d: "Your menu goes live instantly. Guests can browse and order from your public Dineri page.",
          },
        ],
      },
      {
        heading: "Menu overview",
        type: "list",
        items: [
          "Total number of categories on your menu.",
          "Total number of dishes across all categories.",
          "Categories currently visible to guests.",
          "Number of dishes marked as Featured.",
        ],
      },
      {
        heading: "Important to know",
        type: "list",
        items: [
          "Photos are optional but highly recommended. Dishes with photos get significantly more attention.",
          "If food ordering is disabled, prices are hidden and guests can only browse the menu.",
          "Drag the grip icon to reorder categories and dishes.",
        ],
      },
      {
        heading: "Tips",
        type: "list",
        items: [
          "Create your categories before adding dishes for the smoothest setup experience.",
          "Use high quality square photos, 512x512px works best.",
          "Keep descriptions short and clear.",
          "Use the Featured highlight to draw attention to your best or most profitable dishes.",
          "Review allergen information regularly to stay compliant.",
          "Use Public visibility to hide dishes that are temporarily unavailable instead of deleting them.",
        ],
      },
    ],
  },
  {
    id: "events",
    number: "07",
    icon: Calendar,
    title: "Events",
    intro:
      "Announce live music, holiday dinners, tastings or any special activity. Events appear automatically on your profile and can be promoted via popups.",
    blocks: [
      {
        heading: "How it works",
        type: "list",
        items: [
          "Go to Events → New event. Fill in the title, date, time and location.",
          "Add a description but keep it short. Short paragraphs read best on mobile.",
          "Optionally add a button with custom text and link. Leave both blank if you don't need one.",
          "Click Save event. The event appears on your public Dineri page instantly.",
          "Keep your page fresh and give guests a reason to come back.",
        ],
      },
      {
        heading: "Key benefits",
        type: "list",
        items: [
          "Promote special nights, seasonal menus and unique experiences directly to your guests.",
          "Events appear automatically on your public Dineri page the moment you publish them.",
          "Guests can discover and sign up for your events without leaving your page.",
        ],
      },
      {
        heading: "Important to know",
        type: "list",
        items: [
          "Events must start at least 2 hours from now in your venue timezone.",
          "Keep descriptions short and clear. Short paragraphs read best on mobile.",
          "The button is optional. Use it to link to an external page or more information.",
          "Once the event date has passed, the event automatically disappears from your public page.",
        ],
      },
      {
        heading: "Tips",
        type: "list",
        items: [
          "Use an engaging title and description.",
          "Share your link on Instagram and WhatsApp to reach more guests.",
          "Create events well in advance to give guests time to plan.",
          "Remove ended events from your dashboard to keep things organized.",
        ],
      },
    ],
  },
  {
    id: "faq",
    number: "08",
    icon: HelpCircle,
    title: "FAQ",
    intro:
      "Stop answering the same questions every day. Add a FAQ section to your Dineri page in minutes. Answer your guests' most common questions once and let your page do the talking.",
    blocks: [
      {
        heading: "How it works",
        type: "items",
        items: [
          {
            t: "Create categories",
            d: "To organize your FAQ into topics like General, Reservations or Dietary. Drag to reorder anytime.",
          },
          {
            t: "Add a question",
            d: "Choose the category, fill in the question and write a clear answer.",
          },
          {
            t: "Set visibility",
            d: "By toggling Public visibility to show or hide individual questions from guests.",
          },
          {
            t: "Reorder",
            d: "Questions by dragging them into your preferred order within each category.",
          },
          { t: "Save", d: "And your FAQ appears instantly on your public Dineri page." },
        ],
      },
      {
        heading: "Key benefits",
        type: "list",
        items: [
          "Fewer calls and messages from guests who find answers themselves.",
          "Quick setup with pre-written questions to go live in minutes.",
          "Full control to write your own questions for a personal touch.",
          "Better guest experience, guests get the information they need instantly.",
        ],
      },
      {
        heading: "Tips",
        type: "list",
        items: [
          "Cover the basics first. Opening hours, parking, dietary options and reservation policy.",
          "Keep answers short and easy to read on mobile.",
          "Use multiple categories to keep your FAQ organized by topic.",
          "Update your FAQ whenever your hours, menu or policies change.",
          "Think like a guest. What would you want to know before visiting?",
        ],
      },
    ],
  },
  {
    id: "popups",
    number: "09",
    icon: MessageSquare,
    title: "Popups",
    intro:
      "Grab your guests attention the moment they arrive. Show a popup to guests when they visit your Dineri page. Perfect for promotions, event announcements, special offers or any important message you want to highlight.",
    blocks: [
      {
        heading: "Popup types",
        type: "items",
        items: [
          {
            t: "Homepage popup",
            d: "Shown when a guest opens your public Dineri page. Perfect for a welcome message, promotion or event announcement.",
          },
          {
            t: "Reserve table page popup",
            d: "Shown on your reservation page. Use it to highlight availability or special offers for guests who are about to book.",
          },
          {
            t: "Menu page popup",
            d: "Shown on your food ordering/menu page. Great for highlighting specials, new dishes or a limited time offer.",
          },
        ],
      },
      {
        heading: "Settings",
        type: "list",
        items: [
          "Badge adds a short label like 'New' or 'Tonight only' to grab attention.",
          "Title and body is your main popup message. Keep it short and clear.",
          "CTA button directs guests to the right page with a custom label and URL.",
          "Footer note adds optional extra information below the CTA button.",
          "Shown on lets you choose restaurant page, menu page, reserve table page or a combination.",
          "Time to display controls when the popup appears immediately, after 10, 30 seconds or 1 minute.",
          "Toggle visibility shows or hides the popup without deleting it.",
        ],
      },
      {
        heading: "Tips",
        type: "list",
        items: [
          "Use an immediate delay so the popup appears as soon as guests land on your page. Or set a 10 to 30 second delay so it feels more natural.",
          "Toggle popups off instead of deleting them so you can reuse them later for the same event or promotion.",
          "Track your CTR to see which popups perform best and adjust your message accordingly.",
          "Use popups to promote events, seasonal menus or special offers.",
          "Update your popup content regularly to keep it relevant for returning guests.",
          "Less is more. Only activate one or two popups at a time to avoid overwhelming your guests.",
        ],
      },
    ],
  },
  {
    id: "qr-codes",
    number: "10",
    icon: QrCode,
    title: "QR codes",
    intro:
      "Generate branded QR codes that link to your menu, events or any URL. Every scan is tracked in your analytics dashboard.",
    blocks: [
      {
        heading: "How it works",
        type: "items",
        items: [
          {
            t: "1. Generate",
            d: "Open the QR Generator, name the code, and pick a type: Restaurant page, Existing link, or Custom link.",
          },
          {
            t: "2. Customize",
            d: "Adjust colors, upload your logo, and add personalized text below the code.",
          },
          {
            t: "3. Save & manage",
            d: "Codes are stored in your overview list. Download to print or share digitally.",
          },
        ],
      },
      {
        heading: "Key benefits",
        type: "list",
        items: [
          "Flexible linking - restaurant page, saved links, or custom URLs.",
          "Brand customization - colors, logo, custom text.",
          "Trackable - every scan is logged in analytics.",
          "Reusable - codes don't change when you update content.",
        ],
      },
      {
        heading: "Use cases",
        type: "list",
        items: [
          "Place QR codes on tables for instant menu access.",
          "Add to flyers or posters to promote events.",
          "Share on social media for promotions or videos.",
          "Place branded codes at the entrance for a professional first impression.",
        ],
      },
    ],
  },
  {
    id: "success-story",
    number: "11",
    icon: Trophy,
    title: "Success story",
    intro:
      "Showcase guest reviews, press features, and milestones to build trust with new visitors. Curate the stories that best represent your brand.",
    blocks: [
      {
        heading: "How it works",
        type: "items",
        items: [
          {
            t: "1. Add a story",
            d: "Open Success Stories → Add Story. Enter a title, quote or summary, and the source (guest, press, partner).",
          },
          {
            t: "2. Attach media",
            d: "Upload a photo or logo to give the story visual weight on your profile.",
          },
          {
            t: "3. Order & publish",
            d: "Drag stories into your preferred sequence. Updates go live instantly.",
          },
        ],
      },
      {
        heading: "Key benefits",
        type: "list",
        items: [
          "Build credibility with real guest voices and press mentions.",
          "Highlight milestones - awards, anniversaries, sold-out events.",
          "Convert undecided visitors into bookings and orders.",
          "Refresh content easily as new wins come in.",
        ],
      },
      {
        heading: "Tips",
        type: "list",
        items: [
          "Keep quotes short and punchy - one or two sentences works best.",
          "Mix guest reviews with press features for variety.",
          "Always credit the author with name, role, or publication.",
          "Rotate stories seasonally so the section stays fresh.",
        ],
      },
    ],
  },
  {
    id: "gallery",
    number: "12",
    icon: ImageIcon,
    title: "Gallery",
    intro:
      "Show off your space, plates, and atmosphere with a curated photo gallery. A strong gallery turns visitors into guests before they even read the menu.",
    blocks: [
      {
        heading: "How it works",
        type: "items",
        items: [
          {
            t: "1. Upload photos",
            d: "Open Gallery → Upload. Add multiple images at once - JPG, PNG, or WebP.",
          },
          {
            t: "2. Organize",
            d: "Group images into collections (Food, Interior, Events). Reorder by dragging.",
          },
          {
            t: "3. Publish",
            d: "Toggle visibility per image or collection. Changes appear instantly on your profile.",
          },
        ],
      },
      {
        heading: "Key benefits",
        type: "list",
        items: [
          "Visual storytelling - show ambiance, plating, and personality.",
          "Organized collections - guests find what interests them fast.",
          "Lightweight delivery - images are optimized automatically.",
          "Mobile-first display - looks great on every device.",
        ],
      },
      {
        heading: "Tips",
        type: "list",
        items: [
          "Use high-quality, well-lit photos - natural light works best.",
          "Lead with your hero image - first impressions matter.",
          "Keep collections focused - quality over quantity.",
          "Update seasonally to reflect new menu items or events.",
        ],
      },
    ],
  },
];

const SectionHeading = ({ number, label, title }: Section) => (
  <header className="mb-6">
    <div className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[11px] text-muted-foreground">
      /{number} - {label}
    </div>
    <h2 className="font-inter-tight mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
      {title}
    </h2>
  </header>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="space-y-3">
    {items.map((it) => (
      <li key={it} className="flex gap-3 text-[15px] leading-relaxed text-foreground/85">
        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-lime" />
        <span>{it}</span>
      </li>
    ))}
  </ul>
);

const ItemList = ({ items }: { items: { t: string; d: string }[] }) => (
  <ul className="grid gap-3 sm:grid-cols-2">
    {items.map((it) => (
      <li key={it.t} className="rounded-xl border border-foreground/5 bg-surface-1 p-4">
        <div className="font-inter-tight text-sm font-semibold tracking-tight">{it.t}</div>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{it.d}</p>
      </li>
    ))}
  </ul>
);

const Block = ({
  heading,
  type,
  items,
}: {
  heading: string;
  type: "list" | "items";
  items: (string | { t: string; d: string })[];
}) => (
  <div className="mt-8 first:mt-0">
    <h3 className="font-inter-tight text-base font-semibold tracking-tight">{heading}</h3>
    <div className="mt-4">
      {type === "list" ? (
        <BulletList items={items as string[]} />
      ) : (
        <ItemList items={items as { t: string; d: string }[]} />
      )}
    </div>
  </div>
);

const Sidebar = () => {
  const [active, setActive] = useState<string>("why");

  useEffect(() => {
    const ids = sidebar.flatMap((g) => g.items.map((i) => i.id));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="sticky top-24 hidden max-h-[calc(100vh-7rem)] overflow-y-auto pr-4 lg:block">
      <ul className="space-y-7">
        {sidebar.map((group) => (
          <li key={group.group}>
            <div className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
              {group.group}
            </div>
            <ul className="mt-3 space-y-1.5 border-l border-foreground/10">
              {group.items.map((it) => {
                const isActive = active === it.id;
                return (
                  <li key={it.id}>
                    <Link
                      href={`#${it.id}`}
                      className={`-ml-px block border-l-2 py-1 pl-4 text-[13px] transition-colors ${
                        isActive
                          ? "border-lime text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {it.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  );
};
