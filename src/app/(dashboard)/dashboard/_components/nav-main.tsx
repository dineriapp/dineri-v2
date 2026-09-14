"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { PlanName } from "@/lib/stripe/plans";
import { cn } from "@/lib/utils";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavMain({
  items,
  title,
  plan,
  ...props
}: {
  title: string;
  plan: PlanName;
  items: {
    title: string;
    url: string;
    icon: React.ReactNode;
    requiredPlan?: readonly PlanName[];
    comingSoon?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname();
  return (
    <SidebarGroup {...props}>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = item.items?.length
            ? pathname.startsWith(item.url) // only for items that have children
            : pathname === item.url; // exact match for single links
          const locked =
            (item.requiredPlan && !item.requiredPlan.includes(plan)) || item.comingSoon;
          return (
            <Collapsible key={item.title} asChild>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild={!locked}
                  tooltip={item.title}
                  className={cn(
                    "rounded-full",
                    isActive && "bg-surface-2 text-foreground ring-1 ring-white/10",
                    locked && "cursor-not-allowed opacity-50",
                  )}
                >
                  {locked ? (
                    <div className="flex w-full items-center gap-2">
                      {item.icon}

                      <span>{item.title}</span>

                      <span className="ml-auto rounded bg-white/5 px-1.5 py-0.5 font-jetbrains-mono text-[9px] uppercase text-white">
                        {item.comingSoon ? "Coming soon" : "PRO"}
                      </span>
                    </div>
                  ) : (
                    <Link href={item.url}>
                      {item.icon}
                      <span>{item.title}</span>
                    </Link>
                  )}
                </SidebarMenuButton>
                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:rotate-90">
                        <ChevronRightIcon />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild>
                              <a href={subItem.url}>
                                <span>{subItem.title}</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
