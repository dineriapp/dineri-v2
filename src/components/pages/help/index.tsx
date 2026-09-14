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
      { id: "why", label: "Why use this platform?" },
      { id: "who", label: "Who is it for?" },
      { id: "key-points", label: "Key points to remember" },
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
    title: "Centralized management",
    desc: "Manage menus, orders, events, and promotions all in one place.",
  },
  {
    title: "Seamless guest experience",
    desc: "Give your customers a modern and smooth way to interact with your business.",
  },
  {
    title: "Actionable insights",
    desc: "Analytics that show you what's working and where you can improve.",
  },
  {
    title: "Scalable & flexible",
    desc: "Start small and grow with advanced features as your needs expand.",
  },
  {
    title: "Easy to use",
    desc: "No technical background required - designed for everyone.",
  },
];

const audiences = [
  {
    name: "Restaurants & cafés",
    desc: "Simplify reservations, orders, and menu management.",
  },
  {
    name: "Bars & lounges",
    desc: "Promote events and engage customers with QR codes and popups.",
  },
  {
    name: "Hospitality businesses",
    desc: "Gain insights through analytics and streamline operations.",
  },
  {
    name: "Private chefs & catering",
    desc: "Showcase menus, manage bookings, and offer a personalized experience.",
  },
  {
    name: "Food trucks & pop-ups",
    desc: "Share your location, menu, and updates instantly.",
  },
];

const keyPoints = [
  "One central dashboard - menus, orders, analytics and events in one place.",
  "Quick setup - be up and running in just a few minutes.",
  "No technical skills required - the editor is simple and intuitive.",
  "Flexible features - turn modules (events, popups, QR) on or off.",
  "Mobile-friendly - works seamlessly on any device.",
  "Customizable design - match your brand identity.",
  "Real-time updates - changes are reflected instantly.",
  "Secure & reliable - your data and customers are protected.",
  "Scalable - start small and expand as your business grows.",
];

const newFeatures = [
  {
    title: "Menu editor",
    desc: "Create and customize your menu with descriptions, pricing, allergens and add-ons. Show a Quick menu teaser on your profile, or open the full menu for ordering.",
  },
  {
    title: "QR codes",
    desc: "Generate QR codes that connect guests to your menu, events, or promotions. Every scan is tracked in real time.",
  },
  {
    title: "Popups",
    desc: "Customizable popups to announce news, promote events, or welcome guests on your ordering page.",
  },
];

const improvements = [
  "More typography options - expanded font choices for greater customization.",
  "Dashboard design tweaks - cleaner, more user-friendly layout.",
  "Bug fixes - minor issues resolved for a smoother experience.",
];

const comingSoon = [
  {
    title: "Loyalty tools",
    desc: "Reward repeat guests with discounts and digital punch cards.",
  },
  {
    title: "Reservation tool integration",
    desc: "Connect Dineri with your existing booking system.",
  },
  {
    title: "Advanced analytics",
    desc: "Export reports and gain deeper insights into performance.",
  },
];

const HelpPage = () => {
  return (
    <>
      <PageHeader
        number="08"
        label="Support · Help Center"
        headline={[{ plain: "Everything you need to " }, { lime: "run Dineri." }]}
        description="Welcome. This guide gets you started fast and explains every module - menus, orders, links, events, FAQs, popups, QR codes and analytics."
        richClassName="max-w-4xl"
      />
      <section className="relative">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16 lg:px-8 lg:py-24">
          <Sidebar />

          <div className="min-w-0 space-y-24">
            {/* INTRODUCTION ------------------------------------------- */}
            <article id="why" className="scroll-mt-24">
              <SectionHeading
                id="why"
                number="01"
                label="Introduction"
                title="Why use this platform?"
              />
              <p className="text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                We combine simplicity, flexibility and powerful features so you can focus on running
                your business while we handle the technical side.
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
              <SectionHeading id="who" number="01" label="Introduction" title="Who is it for?" />
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
                title="Key points to remember"
              />
              <BulletList items={keyPoints} />
            </article>

            {/* WHAT'S NEW --------------------------------------------- */}
            <article id="new-features" className="scroll-mt-24">
              <SectionHeading
                id="new-features"
                number="02"
                label="What's new · September 2025"
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
                label="What's new · October 2025"
                title="Improvements"
              />
              <BulletList items={improvements} />
            </article>

            <article id="coming-soon" className="scroll-mt-24">
              <SectionHeading
                id="coming-soon"
                number="02"
                label="What's new · Roadmap"
                title="Coming soon"
              />
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
              <SectionHeading id="support" number="13" label="Contact · Support" title="Get help" />
              <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                Can&apos;t find what you&apos;re looking for? Our team usually replies within 2
                hours on business days.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-foreground/5 bg-surface-1 p-6">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime/10 text-lime">
                    <LifeBuoy className="h-4 w-4" />
                  </div>
                  <h3 className="font-inter-tight mt-5 text-base font-semibold tracking-tight">
                    Email support
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Reach us directly - we reply within 2 hours on business days.
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
                    Technical issue, billing question, account problem or feature request - we route
                    it to the right team.
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
      "Track views, QR scans, and orders to understand how guests interact with your business. Clear insights help you improve menus, promotions, and overall performance.",
    blocks: [
      {
        heading: "Key metrics explained",
        type: "items",
        items: [
          { t: "Total link views", d: "Every click on your shared link, including repeats." },
          { t: "Unique link visitors", d: "Individual people who clicked your link." },
          { t: "Page views", d: "Every view of your menu or page, including repeats." },
          { t: "Unique page visitors", d: "Different people who visited your page." },
        ],
      },
      {
        heading: "Key benefits",
        type: "list",
        items: [
          "Understand guest behavior - see which items get the most attention.",
          "Measure QR code performance - track scans by code and location.",
          "Order insights - learn which dishes sell best and when.",
          "Data-driven decisions - optimize menu, pricing, and promotions.",
        ],
      },
      {
        heading: "Tips",
        type: "list",
        items: [
          "Check analytics weekly to spot trends early.",
          "Compare time periods (last week vs this week) to measure growth.",
          "Use insights to test new promotions or highlight popular items.",
          "Combine with Events or Popups to see which strategies drive engagement.",
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
      "Run online ordering from one dashboard. Add menu items, manage order statuses, set delivery costs, and export your full order history.",
    blocks: [
      {
        heading: "How it works",
        type: "items",
        items: [
          {
            t: "Open your menu page",
            d: "Your menu lives at /menu (e.g. dineri.app/your-restaurant/menu). Customize the layout from the bottom-right.",
          },
          {
            t: "Add menu items",
            d: "Dashboard → Menu → Add menu item. Use Public visibility to choose whether it also appears in the Quick menu on your profile.",
          },
          {
            t: "Manage orders",
            d: "Update statuses: Pending, In Progress, Completed or Cancelled. Each order shows items, quantity and time.",
          },
        ],
      },
      {
        heading: "Dashboard controls",
        type: "items",
        items: [
          { t: "Restaurant status", d: "Set availability for delivery, pickup, or unavailable." },
          { t: "Delivery costs", d: "Define your own delivery fees in the dashboard." },
          { t: "Refresh timer", d: "Auto-refresh the orders screen every 2, 5, or 15 minutes." },
          {
            t: "Opening hours",
            d: "Set your restaurant's opening times (single schedule for delivery and pickup).",
          },
          { t: "Order export", d: "Download full order history as Excel for accounting." },
        ],
      },
      {
        heading: "Tips",
        type: "list",
        items: [
          "Add your menu items before customizing the layout for the best editing experience.",
          "Check restaurant status during busy times to avoid missed orders.",
          "Use the refresh timer on a kitchen tablet for hands-free updates.",
          "Export your order history monthly to keep records organized.",
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
      "Centralize every important link - website, socials, reservations, menu - into one shareable hub guests can navigate in seconds.",
    blocks: [
      {
        heading: "How it works",
        type: "list",
        items: [
          "Click Add Link, then enter title, URL and an optional icon.",
          "Reorder links by dragging into your preferred sequence.",
          "Save - updates go live instantly.",
        ],
      },
      {
        heading: "Key benefits",
        type: "list",
        items: [
          "Central hub - all important links in one accessible place.",
          "Customizable - titles, order, and icons match your brand.",
          "Instant updates - changes are reflected immediately.",
          "More engagement - easy multi-platform reach for guests.",
        ],
      },
      {
        heading: "Tips",
        type: "list",
        items: [
          "Add a reservation link so guests can book directly.",
          "Include socials for visibility and engagement.",
          "Keep the list short - too many links overwhelms guests.",
          "Use Analytics to track which links get the most clicks.",
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
      "Build a structured digital menu with categories, descriptions, allergens and add-ons. Show a short Quick menu on your profile and let guests order from the full menu page.",
    blocks: [
      {
        heading: "How it works",
        type: "items",
        items: [
          {
            t: "1. Create categories",
            d: "Organize your dishes into groups such as Starters, Mains and Drinks, and set the order they appear in.",
          },
          {
            t: "2. Add menu items",
            d: "Menu → Add menu item. Fill in the name, description and price, then assign a category.",
          },
          {
            t: "3. Allergens & add-ons",
            d: "Tag allergens and dietary options, and offer add-ons guests can choose when they order.",
          },
          {
            t: "4. Save & publish",
            d: "Updates appear instantly on your menu page, QR codes and links.",
          },
        ],
      },
      {
        heading: "Key benefits",
        type: "list",
        items: [
          "Structured menus - easy navigation through categories.",
          "Public visibility - show a short teaser on your profile or the full menu.",
          "Allergen details help guests make informed choices.",
          "Flexible add-ons increase order value.",
          "Real-time updates everywhere.",
        ],
      },
      {
        heading: "Tips",
        type: "list",
        items: [
          "Create categories before adding items to keep things tidy.",
          "Enable only the most relevant categories in the Quick Menu.",
          "Keep descriptions clear and short.",
          "Use add-ons for upsells (toppings, sauces).",
          "Review allergen info regularly for compliance.",
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
          "Open the Events section and click Add Event.",
          "Enter title, description, date & time, and location if different.",
          "Save - the event appears on your profile and in a dedicated Events link.",
          "Edit or remove events at any time; changes apply instantly.",
        ],
      },
      {
        heading: "Key benefits",
        type: "list",
        items: [
          "Promote special nights, offers and seasonal activities.",
          "Unlimited events on paid plans.",
          "Automatic visibility on your profile.",
          "Combine with popups for real-time announcements.",
        ],
      },
      {
        heading: "Tips",
        type: "list",
        items: [
          "Use engaging descriptions like 'Live DJ + cocktail specials'.",
          "Generate a dedicated QR code for the event page.",
          "Archive past events to keep your profile fresh.",
          "Combine events with popups for maximum visibility.",
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
      "Add frequently asked questions so guests find answers fast. Start with our Quick Setup or write your own from scratch.",
    blocks: [
      {
        heading: "How it works",
        type: "items",
        items: [
          {
            t: "Quick Setup",
            d: "Pick from pre-written questions (hours, payment, dietary) and tweak them.",
          },
          { t: "Manual Setup", d: "Write your own questions and answers one by one." },
        ],
      },
      {
        heading: "Key benefits",
        type: "list",
        items: [
          "Save time with pre-written FAQs.",
          "Reduce repetitive questions from guests.",
          "Flexible setup - speed or full control.",
          "Better customer experience.",
        ],
      },
      {
        heading: "Tips",
        type: "list",
        items: [
          "Use Quick Setup to go live fast.",
          "Keep answers short and easy to read.",
          "Cover basics: hours, allergens, delivery, payment.",
          "Update whenever your menu or policies change.",
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
      "Highlight important info the moment a guest visits. Perfect for promotions, urgent announcements, or event reminders.",
    blocks: [
      {
        heading: "Popup types",
        type: "items",
        items: [
          {
            t: "Homepage popup",
            d: "Display an announcement when visitors open your main profile.",
          },
          { t: "Restaurant page popup", d: "Show messages on your food ordering page." },
          { t: "Events popup", d: "Highlight upcoming events automatically." },
        ],
      },
      {
        heading: "Settings",
        type: "list",
        items: [
          "Title and message.",
          "Popup type - homepage, restaurant page, events, or combinations.",
          "Delay - seconds after page load before showing.",
          "Action button - toggle the Explore call-to-action.",
          "Event options - time range, max events, rotation speed.",
        ],
      },
      {
        heading: "Tips",
        type: "list",
        items: [
          "Use a 2–3 second delay so popups feel natural.",
          "Combine homepage + event popups for visibility.",
          "Limit events per popup so it doesn't overwhelm.",
          "Update content regularly to stay relevant.",
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
