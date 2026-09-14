"use client";

import {
  CalendarCheck,
  CalendarClock,
  CreditCard,
  Grid3x3,
  LayoutDashboard,
  MapPin,
  Plus,
  ScrollText,
  Settings as SettingsIcon,
  ShieldAlert,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import FeatureNotAvailable from "@/components/shared/feature-not-available";
import { useAuth } from "@/lib/auth/hooks/use-auth";
import { hasFeature } from "@/lib/stripe/checkers";
import { useSelectedRestaurant } from "@/stores/restaurant-store";
import { toast } from "sonner";
import { SectionHeader } from "../../../_components";
import TopBar from "../../../_components/top-bar";
import {
  DEFAULT_RESERVATION_TAB,
  type ReservationSettingType,
  type ReservationTabId,
} from "../types";
import { AreasTab } from "./areas/areas-tab";
import { ReservationsDashboardTab } from "./dashboard/dashboard-tab";
import { PaymentsTab } from "./payments/payments-tab";
import { PoliciesTab } from "./policies/policies-tab";
import { SettingsTab } from "./reservation-settings";
import { ServiceTab } from "./service/service-tab";
import { TablesTab } from "./tables/tables-tab";

const TABS: { id: ReservationTabId; label: string; icon: React.ElementType }[] = [
  { id: "timeline", label: "Timeline", icon: CalendarClock },
  { id: "list-view", label: "List view", icon: LayoutDashboard },
  { id: "tables", label: "Tables", icon: Grid3x3 },
  { id: "areas", label: "Areas", icon: MapPin },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "policies", label: "Policies", icon: ScrollText },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export const ReservationsWorkspace = ({ initialTab }: { initialTab: ReservationTabId }) => {
  const router = useRouter();
  const { session } = useAuth();
  const restaurant = useSelectedRestaurant();
  const settings = restaurant.reservation_settings as ReservationSettingType;

  const [tab, setTab] = useState<ReservationTabId>(initialTab);

  const selectTab = (id: ReservationTabId) => {
    setTab(id);

    const params = new URLSearchParams(window.location.search);
    if (id === DEFAULT_RESERVATION_TAB) {
      params.delete("tab");
    } else {
      params.set("tab", id);
    }
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  };

  const reservationsEnabled = hasFeature(
    session?.user.subscription.plan ?? "starter",
    "reservations",
  );

  const goToNewReservation = (prefill?: { date?: string; time?: string; areaId?: string }) => {
    if (settings.emergencyStop || !settings.acceptingReservations) {
      toast("Reservations are paused", {
        description: "Re-enable bookings in Settings to add new reservations.",
      });
      return;
    }
    const params = new URLSearchParams();
    if (prefill?.date) params.set("date", prefill.date);
    if (prefill?.time) params.set("time", prefill.time);
    if (prefill?.areaId) params.set("areaId", prefill.areaId);
    const qs = params.toString();
    router.push(`/dashboard/reservations/new${qs ? `?${qs}` : ""}`);
  };

  if (!reservationsEnabled) {
    return (
      <FeatureNotAvailable
        featureName="Reservations"
        showBackButton={false}
        description="Take table bookings from your page, manage the floor, and track covers per service."
        requiredPlan="growth"
      />
    );
  }

  return (
    <>
      <TopBar page="Reservations" />
      <div className="p-4 space-y-4 animate-fade-in sm:p-6 sm:space-y-6">
        <SectionHeader
          iconClassName="text-white"
          icon={CalendarCheck}
          title="Reservations"
          description="Run the floor with a unified workspace for bookings, tables, areas, payments, and policy."
          badge={
            settings.emergencyStop
              ? "Emergency stop"
              : !settings.acceptingReservations
                ? "Paused"
                : `upcoming`
          }
          actions={
            <button
              onClick={() => goToNewReservation()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3.5 text-xs font-semibold text-background shadow-[0_8px_24px_-8px_rgba(255,255,255,0.6)] hover:bg-white/90"
            >
              <Plus className="h-3.5 w-3.5" /> New reservation
            </button>
          }
        />

        {/* Emergency banner */}
        {settings.emergencyStop && (
          <div className="dash-card flex items-center gap-3 rounded-2xl border border-danger/30 bg-danger/10 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-danger/30 bg-danger/20 text-danger">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-danger">Emergency stop is active</div>
              <p className="text-xs text-danger/80">
                All incoming reservations are blocked. Existing bookings remain visible.
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="dash-card flex flex-wrap items-center gap-1 rounded-2xl border border-white/5 bg-surface-1 p-1.5">
          {TABS.map((t) => {
            const active = tab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => selectTab(t.id)}
                aria-current={active ? "page" : undefined}
                className={`inline-flex h-9 flex-1 min-w-27.5 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-medium transition ${
                  active
                    ? "bg-white text-background shadow-[0_6px_18px_-8px_rgba(255,255,255,0.6)]"
                    : "text-muted-foreground hover:bg-background hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === "timeline" && <ServiceTab />}
        {tab === "list-view" && <ReservationsDashboardTab />}
        {tab === "tables" && <TablesTab />}
        {tab === "areas" && <AreasTab />}
        {tab === "payments" && <PaymentsTab />}
        {tab === "policies" && <PoliciesTab />}
        {tab === "settings" && <SettingsTab />}
      </div>
    </>
  );
};
