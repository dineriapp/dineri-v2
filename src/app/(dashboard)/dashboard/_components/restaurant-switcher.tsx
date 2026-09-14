"use client";

import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useAuth } from "@/lib/auth/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useUserRestaurants } from "@/lib/tanstack-react-query/hooks/restaurants";
import { useSelectedRestaurant } from "@/stores/restaurant-store";
import { Plus } from "lucide-react";
import Link from "next/link";

interface Props {
  onChange?: (id: string) => void;
  className?: string;
}

export function RestaurantSwitcher({ onChange, className }: Props) {
  const restaurant = useSelectedRestaurant();
  const { user } = useAuth();
  const { data: restaurants = [] } = useUserRestaurants();
  return (
    <>
      <div className={cn("px-4 mt-5", className)}>
        <div className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[9px] text-muted-foreground">
          Workspace
        </div>
        <Select
          value={restaurant.id ?? undefined}
          onValueChange={(val) => {
            onChange?.(val);
          }}
        >
          <SelectTrigger className="mt-2 flex cursor-pointer w-full h-13! items-center justify-between rounded-xl border border-white/10 bg-surface-2 px-3 py-2.5 text-left transition hover:border-white/20">
            <div className="flex items-center gap-2.5">
              <div className="font-jetbrains-mono uppercase tracking-[0.12rem] flex h-7 w-7 items-center justify-center rounded-md bg-white/5 text-[9px]">
                {restaurant?.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium leading-tight">{restaurant?.name}</div>
                <div className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[9px] text-muted-foreground">
                  {restaurant?.slug}
                </div>
              </div>
            </div>
          </SelectTrigger>

          <SelectContent className="border-foreground/10  bg-background p-0">
            <div className="flex h-fit max-h-80 flex-col">
              {/* Scrollable restaurants */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                {restaurants.map((r) => (
                  <SelectItem key={r.id} value={r.id} className="h-13! cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/5 text-[9px] font-jetbrains-mono uppercase">
                        {r.name.slice(0, 2)}
                      </div>

                      <div className="flex flex-col">
                        <span className="text-sm">{r.name}</span>

                        <span className="text-[9px] text-muted-foreground uppercase font-jetbrains-mono">
                          {r.slug}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </div>

              {/* Fixed bottom action */}
              {user?.subscription?.plan === "scale" && restaurants.length < 5 && (
                <div className="border-t border-white/10 p-2">
                  <Link
                    href="/onboarding"
                    className="flex items-center gap-2 rounded-lg border border-dashed border-white/10 px-3 py-2 text-sm transition hover:border-white/20 hover:bg-white/5"
                  >
                    <Plus className="h-4 w-4 text-white" />

                    <div className="flex flex-col">
                      <span>Add restaurant</span>

                      <span className="font-jetbrains-mono text-[9px] uppercase tracking-[0.12rem] text-muted-foreground">
                        Create new restaurant
                      </span>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
