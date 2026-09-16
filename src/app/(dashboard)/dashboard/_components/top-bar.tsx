"use client";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Eyebrow } from "@/components/ui/ui-kit/Eyebrow";
import { cn } from "@/lib/utils";
import { useRestaurantStore } from "@/stores/restaurant-store";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { venueUrl } from "@/lib/venue-url";
type TopBarProps = {
  page?: string | string[];
  breadcrumbs?: string[];
  showSidebarTrigger?: boolean;
  showLanguageSwitcher?: boolean;
  showLiveBadge?: boolean;
  showViewButton?: boolean;
};

const TopBar = ({
  page,
  breadcrumbs,
  showSidebarTrigger = true,
  showLiveBadge = true,
  showViewButton = true,
}: TopBarProps) => {
  const selectedRestaurant = useRestaurantStore((s) => s.selectedRestaurant);
  const trail =
    breadcrumbs ??
    ["Restaurant", selectedRestaurant?.name, ...(Array.isArray(page) ? page : [page])].filter(
      (segment): segment is string => !!segment?.trim(),
    );

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-3 bg-surface-1 border-b border-b-white/5 sm:px-6">
      {/* LEFT */}
      <div className="flex min-w-0 items-center gap-2">
        {showSidebarTrigger && <SidebarTrigger className="-ml-1 shrink-0" />}

        {showSidebarTrigger && (
          <Separator
            orientation="vertical"
            className="mr-1 shrink-0 data-vertical:h-4 data-vertical:self-auto sm:mr-2"
          />
        )}

        {trail.length > 0 && (
          <Eyebrow
            className="min-w-0 uppercase px-2.5 sm:px-4"
            classNameSpan="flex min-w-0 items-center gap-2"
          >
            {trail.map((item, index) => {
              const isLast = index === trail.length - 1;
              return (
                <span
                  key={index}
                  className={cn("items-center gap-2", isLast ? "flex min-w-0" : "hidden md:flex")}
                >
                  <span className={cn("truncate", isLast && "text-white")}>{item}</span>
                  {!isLast && <span className="shrink-0">/</span>}
                </span>
              );
            })}
          </Eyebrow>
        )}
      </div>

      {/* RIGHT */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {showLiveBadge && (
          <span className="hidden items-center gap-1.5 rounded-xl border border-white/10 bg-surface-1 px-3 py-2 text-xs sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Live
          </span>
        )}

        {showViewButton && (
          <Link
            href={selectedRestaurant?.slug ? venueUrl(selectedRestaurant.slug) : "#"}
            target="_blank"
            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-xl bg-white px-2.5 py-2 text-xs font-semibold text-background hover:bg-white/90 sm:px-3"
          >
            <span className="hidden sm:inline">View site</span>
            <span className="sm:hidden">View</span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
          </Link>
        )}
      </div>
    </header>
  );
};

export default TopBar;
