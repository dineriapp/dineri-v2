"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RestaurantOrderSettings } from "@/lib/types/order";
import { updateSelectedRestaurant, useSelectedRestaurant } from "@/stores/restaurant-store";
import { Check, ChevronDown, Percent } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { updateRestaurantOrderSettings } from "./actions";
import { getCurrencySymbol } from "@/lib/stripe/types";

export const restaurantStatusOptions: {
  key: RestaurantOrderSettings["status"];
  label: string;
  tone: string;
  dot: string;
  desc: string;
}[] = [
  {
    key: "open",
    label: "Open",
    tone: "text-success border-success/30 bg-success/10",
    dot: "bg-success",
    desc: "Accepting delivery & pickup",
  },
  {
    key: "no-delivery",
    label: "Disable delivery",
    tone: "text-warning border-warning/30 bg-warning/10",
    dot: "bg-warning",
    desc: "Pickup only",
  },
  {
    key: "no-pickup",
    label: "Disable pickup",
    tone: "text-warning border-warning/30 bg-warning/10",
    dot: "bg-warning",
    desc: "Delivery only",
  },
  {
    key: "closed",
    label: "Disable both (Closed)",
    tone: "text-danger border-danger/30 bg-danger/10",
    dot: "bg-danger",
    desc: "Not accepting orders",
  },
];

const OperationalSettings = () => {
  const [statusOpen, setStatusOpen] = useState(false);
  const selectedRestaurant = useSelectedRestaurant();
  const [draftStatus, setDraftStatus] = useState<RestaurantOrderSettings["status"]>(
    selectedRestaurant?.orderSettings?.status,
  );
  const [draftFee, setDraftFee] = useState<RestaurantOrderSettings["deliveryFee"]>(
    selectedRestaurant?.orderSettings?.deliveryFee,
  );
  const [draftTax, setDraftTax] = useState<RestaurantOrderSettings["taxRate"]>(
    selectedRestaurant?.orderSettings?.taxRate,
  );

  const settingsDirty =
    draftStatus !== selectedRestaurant?.orderSettings?.status ||
    draftFee !== selectedRestaurant?.orderSettings?.deliveryFee ||
    draftTax !== selectedRestaurant?.orderSettings?.taxRate;

  const draftStatusOpt = restaurantStatusOptions.find((s) => s.key === draftStatus)!;

  const saveSettings = async () => {
    const response = await updateRestaurantOrderSettings({
      deliveryFee: draftFee,
      status: draftStatus,
      taxRate: draftTax,
    });

    if (!response.success) {
      toast.error(response.error);
      return;
    }
    updateSelectedRestaurant({
      orderSettings: response?.data,
    });
    setDraftStatus(response?.data.status);
    setDraftFee(response?.data.deliveryFee);
    setDraftTax(response?.data.taxRate);
    toast("Settings saved", { description: "Order configuration updated." });
  };

  return (
    <div className="dash-card rounded-2xl border border-white/5 bg-surface-1 p-4 lg:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-jetbrains-mono uppercase text-[10px] tracking-wider text-muted-foreground">
            Order configuration
          </div>
          <h2 className="mt-0.5 font-inter-tight text-sm font-semibold">
            Restaurant availability & fees
          </h2>
        </div>
        {settingsDirty && (
          <span className="hidden items-center gap-1.5 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] text-warning sm:inline-flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
            Unsaved changes
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-4 lg:items-end">
        {/* Restaurant Status */}
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-muted-foreground">
            Restaurant Status
          </label>
          <DropdownMenu open={statusOpen} onOpenChange={setStatusOpen}>
            <DropdownMenuTrigger asChild>
              <button className="flex h-10 w-full items-center justify-between rounded-lg border border-border/60 bg-background px-3 text-xs hover:border-border focus:outline-none focus:ring-1 focus:ring-ring">
                <span className="flex items-center gap-2 capitalize">
                  <span className={`h-2 w-2 rounded-full ${draftStatusOpt.dot}`} />
                  {draftStatusOpt.label}
                </span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[--radix-dropdown-menu-trigger-width] rounded-lg border-border/60 bg-popover p-1"
            >
              {restaurantStatusOptions.map((s) => (
                <DropdownMenuItem
                  key={s.key}
                  onSelect={() => setDraftStatus(s.key)}
                  className={`flex items-start gap-2 rounded-md px-2 py-2 text-xs ${draftStatus === s.key ? "bg-accent/10" : ""}`}
                >
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
                  <span className="flex-1">
                    <div className="font-medium capitalize">{s.label}</div>
                    <div className="text-[10px] text-muted-foreground">{s.desc}</div>
                  </span>
                  {draftStatus === s.key && <Check className="mt-0.5 h-3 w-3 text-white" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Delivery Fee */}
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-muted-foreground">
            Delivery Fee ({getCurrencySymbol(selectedRestaurant?.stripe?.currency ?? null)})
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {getCurrencySymbol(selectedRestaurant?.stripe?.currency ?? null)}
            </span>
            <input
              type="number"
              step="0.50"
              min="0"
              value={draftFee}
              onChange={(e) => setDraftFee(Number(e.target.value))}
              className="h-10 w-full rounded-lg border border-white/10 bg-background pl-7 pr-3 text-xs tabular-nums focus:border-white/40 focus:outline-none"
            />
          </div>
        </div>

        {/* Tax */}
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-muted-foreground">
            Tax %
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.5"
              min="0"
              max="100"
              value={draftTax}
              onChange={(e) => setDraftTax(Number(e.target.value))}
              className="h-10 w-full rounded-lg border border-white/10 bg-background pl-3 pr-8 text-xs tabular-nums focus:border-white/40 focus:outline-none"
            />
            <Percent className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {/* Save */}
        <button
          onClick={saveSettings}
          disabled={!settingsDirty}
          className={`h-10 rounded-lg px-4 text-xs font-semibold transition ${
            settingsDirty
              ? "bg-white text-background hover:bg-white/90"
              : "cursor-not-allowed border border-white/10 bg-background text-muted-foreground"
          }`}
        >
          {settingsDirty ? "Save Changes" : "Saved"}
        </button>
      </div>
    </div>
  );
};

export default OperationalSettings;
