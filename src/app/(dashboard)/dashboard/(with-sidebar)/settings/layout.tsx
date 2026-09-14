"use client";
import {
  AtSign,
  Building2,
  Clock,
  CreditCard,
  Lock,
  Phone,
  Plug,
  Search,
  Share2,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import TopBar from "../../_components/top-bar";
type SettingsTab =
  | "business"
  | "contact"
  | "password"
  | "hours"
  | "social"
  | "stripe"
  | "email"
  | "popups"
  | "integrations"
  | "subscription";

type SettingsGroup = "Account" | "Business" | "Payments" | "Connections";

const settingsGroups: SettingsGroup[] = ["Business", "Account", "Payments", "Connections"];

const settingsTabs: {
  key: SettingsTab;
  label: string;
  href: string;
  desc: string;
  icon: React.ElementType;
  group: SettingsGroup;
}[] = [
  {
    key: "business",
    label: "Business Information",
    desc: "Name, handle and branding",
    icon: Building2,
    group: "Business",
    href: "/dashboard/settings/business-information",
  },
  {
    key: "contact",
    label: "Contact Information",
    desc: "Email, phone and address",
    icon: Phone,
    group: "Business",
    href: "/dashboard/settings/contact",
  },
  {
    key: "hours",
    label: "Opening Hours",
    desc: "When your venue is open",
    icon: Clock,
    group: "Business",
    href: "/dashboard/settings/hours",
  },
  {
    key: "social",
    label: "Social Media",
    desc: "Link your public profiles",
    icon: Share2,
    group: "Business",
    href: "/dashboard/settings/social",
  },
  {
    key: "password",
    label: "Change Password",
    desc: "Update your account password",
    icon: Lock,
    group: "Account",
    href: "/dashboard/settings/change-password",
  },
  {
    key: "subscription",
    label: "Subscription",
    desc: "Plan, billing and invoices",
    icon: Sparkles,
    group: "Account",
    href: "/dashboard/settings/subscription",
  },
  {
    key: "stripe",
    label: "Stripe Settings",
    desc: "Accept payments and deposits",
    icon: CreditCard,
    group: "Payments",
    href: "/dashboard/settings/stripe",
  },
  {
    key: "email",
    label: "Email Integration",
    desc: "SMTP and outgoing mail",
    icon: AtSign,
    group: "Connections",
    href: "/dashboard/settings/email",
  },
  {
    key: "popups",
    label: "Popups",
    desc: "Welcome and reminder popups",
    icon: Zap,
    group: "Connections",
    href: "/dashboard/settings/popups",
  },
  {
    key: "integrations",
    label: "Integrations",
    desc: "Third-party services",
    icon: Plug,
    group: "Connections",
    href: "/dashboard/settings/integrations",
  },
];

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const activeTab = settingsTabs.find((t) => t.href === pathname);
  const filteredTabs = settingsTabs.filter(
    (t) =>
      !query ||
      t.label.toLowerCase().includes(query.toLowerCase()) ||
      t.desc.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      <TopBar page={activeTab ? ["Settings", activeTab.label] : "Settings"} />
      <div className="p-4 sm:p-6">
        <div className="animate-fade-in">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
            {/* Sidebar - search + grouped nav */}
            <aside className="dash-card h-fit rounded-2xl border border-white/5 bg-surface-1 p-3">
              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search settings…"
                  className="w-full rounded-lg border border-white/10 bg-background py-2 pl-9 pr-3 text-base placeholder:text-muted-foreground/60 focus:border-white/50 focus:outline-none sm:text-xs"
                />
              </div>
              <nav aria-label="Settings sections" className="space-y-4">
                {settingsGroups.map((group) => {
                  const items = filteredTabs.filter((t) => t.group === group);
                  if (!items.length) return null;
                  return (
                    <div key={group}>
                      <div className="font-jetbrains-mono uppercase px-2 pb-1.5 text-[9px] text-muted-foreground/70">
                        {group}
                      </div>
                      <ul className="space-y-1">
                        {items.map((t) => {
                          const Icon = t.icon;
                          const isActive = t.href === pathname;

                          return (
                            <li key={t.key}>
                              <Link
                                type="button"
                                href={t.href}
                                aria-current={isActive ? "page" : undefined}
                                className={`group relative flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition ${
                                  isActive ? "bg-white/10 text-foreground" : "hover:bg-white/3"
                                }`}
                              >
                                {isActive && (
                                  <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-r bg-white" />
                                )}
                                <span
                                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                                    isActive
                                      ? "border-white/30 bg-white/15 text-white"
                                      : "border-white/10 bg-background text-muted-foreground group-hover:text-foreground"
                                  }`}
                                >
                                  <Icon className="h-3.5 w-3.5" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span
                                    className={`block truncate text-sm ${isActive ? "font-medium text-white" : "text-foreground"}`}
                                  >
                                    {t.label}
                                  </span>
                                  <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                    {t.desc}
                                  </span>
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
                {!filteredTabs.length && (
                  <div className="px-2 py-6 text-center text-xs text-muted-foreground">
                    No settings match &quot;{query}&quot;
                  </div>
                )}
              </nav>
            </aside>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
