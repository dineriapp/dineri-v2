"use client";

import { NavMain } from "@/app/(dashboard)/dashboard/_components/nav-main";
import { NavUser } from "@/app/(dashboard)/dashboard/_components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth/hooks/use-auth";
import { PlanName } from "@/lib/stripe/plans";
import { switchActiveRestaurant } from "@/server/actions/switch-restaurant.action";
import {
  CalendarCheck,
  CalendarDays,
  HelpCircle,
  Images,
  LayoutDashboard,
  LinkIcon,
  Mail,
  Palette,
  PieChart,
  QrCode,
  SettingsIcon,
  ShoppingBag,
  Sparkles,
  Trophy,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { RestaurantSwitcher } from "./restaurant-switcher";
import { BrandLogo } from "@/components/shared/brand-logo";

const data = {
  overview: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboard />,
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: <PieChart />,
    },
    {
      title: "Orders",
      url: "/dashboard/orders",
      icon: <ShoppingBag />,
      requiredPlan: ["growth", "scale"] as const,
    },
    {
      title: "Reservations",
      url: "/dashboard/reservations",
      icon: <CalendarCheck />,
      requiredPlan: ["growth", "scale"] as const,
    },
  ],
  content: [
    {
      title: "Links",
      url: "/dashboard/links",
      icon: <LinkIcon />,
    },
    {
      title: "Menu",
      url: "/dashboard/menu",
      icon: <UtensilsCrossed />,
    },
    {
      title: "Events",
      url: "/dashboard/events",
      icon: <CalendarDays />,
    },
    {
      title: "FAQ",
      url: "/dashboard/faq",
      icon: <HelpCircle />,
    },
    {
      title: "Success Story",
      url: "/dashboard/success",
      icon: <Trophy />,
    },
    {
      title: "Gallery",
      url: "/dashboard/gallery",
      icon: <Images />,
    },
    {
      title: "Popups",
      url: "/dashboard/popups",
      icon: <Sparkles />,
      requiredPlan: ["growth", "scale"] as const,
    },
  ],
  marketing: [
    {
      title: "QR Codes",
      url: "/dashboard/qr",
      icon: <QrCode />,
      requiredPlan: ["growth", "scale"] as const,
    },
    {
      title: "Campaigns",
      url: "/dashboard/campaigns",
      icon: <Mail />,
      comingSoon: true,
    },
  ],
  system: [
    {
      title: "Appearance",
      url: "/dashboard/appearance",
      icon: <Palette />,
    },
    {
      title: "Settings",
      url: "/dashboard/settings/business-information",
      icon: <SettingsIcon />,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  return (
    <Sidebar variant="inset" {...props} className="border-r border-white/5 bg-surface-1 p-0!">
      <SidebarHeader className="bg-surface-1 p-5! pb-0!">
        <Link
          href="/dashboard"
          aria-label="Go to dashboard home"
          className="flex items-center gap-3 transition hover:opacity-80"
        >
          <BrandLogo className="h-8" />
        </Link>
      </SidebarHeader>
      <SidebarContent className="bg-surface-1">
        <RestaurantSwitcher
          onChange={async (id) => {
            try {
              const response = await switchActiveRestaurant(id);
              if (!response.success) {
                toast.error(response.error);
                return;
              }
              window.location.href = window.location.href;
            } catch {
              toast.error("Failed to switch restaurant");
            }
          }}
        />
        <NavMain
          items={data.overview}
          plan={user?.subscription?.plan as PlanName}
          title="Overview"
        />
        <NavMain items={data.content} plan={user?.subscription?.plan as PlanName} title="Content" />
        <NavMain
          items={data.marketing}
          plan={user?.subscription?.plan as PlanName}
          title="Marketing"
        />
        <NavMain
          items={data.system}
          plan={user?.subscription?.plan as PlanName}
          title="System"
          className="mt-auto"
        />
      </SidebarContent>
      <SidebarFooter className="bg-surface-1">
        {user?.subscription?.plan !== "scale" && (
          <div className="rounded-2xl border border-white/10 bg-surface-2 p-4">
            <div className="font-jetbrains-mono uppercase text-[9px] text-muted-foreground">
              {user?.subscription?.plan === "starter" ? "Upgrade to Growth" : "Upgrade to Scale"}
            </div>
            <p className="mt-1 text-xs leading-snug">
              {user?.subscription?.plan === "starter"
                ? "Unlock unlimited link menus, advanced customization, analytics, QR codes, reservations & more."
                : "Unlock advanced features and manage up to 5 restaurants at the same time."}
            </p>
            <div className="mt-3 flex w-full items-center justify-center">
              <Link
                href="/dashboard/settings/subscription"
                className="flex w-full items-center justify-center rounded-xl bg-white px-3 py-1.5 text-sm font-semibold text-background transition hover:bg-white/90"
              >
                Upgrade →
              </Link>
            </div>
          </div>
        )}
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
