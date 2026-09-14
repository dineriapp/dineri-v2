"use client";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { PlanLimitBanner } from "@/components/shared/plan-limit-banner";
import { EventType } from "@/drizzle/types";
import { useAuth } from "@/lib/auth/hooks/use-auth";
import { canAddClient, getResourceLimitClient } from "@/lib/stripe/client";
import { useDeleteEvent, useEvents, useToggleEvent } from "@/lib/tanstack-react-query/hooks/events";
import { useRestaurantStore } from "@/stores/restaurant-store";
import { isAfter } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { CalendarDays, Clock, Plus, Sparkles, Ticket } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { SectionHeader, StatCard } from "../../_components";
import TopBar from "../../_components/top-bar";
import Loader from "@/components/ui/loader";
import { EventCard } from "./_components/event-card";
import EventDialog from "./_components/event-dialog";

const getEventStatus = (event: EventType, timezone: string): "live" | "draft" | "ended" => {
  const dateTimeStr = `${event.date}T${event.time}:00`;
  const eventDateTime = toZonedTime(new Date(dateTimeStr), timezone);
  const now = toZonedTime(new Date(), timezone);

  // If event already ended (past date/time), force "ended"
  if (isAfter(now, eventDateTime)) {
    return "ended";
  }

  // Future event: active flag decides live vs draft
  return event.active ? "live" : "draft";
};

const Page = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<EventType | null>(null);
  const { data: events = [], isLoading } = useEvents();
  const selectedRestaurant = useRestaurantStore((state) => state.selectedRestaurant);
  const [filter, setFilter] = useState<"all" | "live" | "draft" | "ended">("all");
  const timezone = selectedRestaurant?.timezone ?? "Europe/London";
  const { mutate: toggleEvent } = useToggleEvent();
  const plan = user?.subscription?.plan ?? "starter";
  const canAddMore = canAddClient(plan, "events", events.length);
  const { mutate: deleteEvent, isPending: isDeleting } = useDeleteEvent();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const eventsWithStatus = useMemo(() => {
    return events.map((event) => ({
      ...event,
      computedStatus: getEventStatus(event, timezone),
    }));
  }, [events, timezone]);

  const totals = useMemo(
    () => ({
      total: events.length,
      live: eventsWithStatus.filter((e) => e.computedStatus === "live").length,
      upcoming: eventsWithStatus.filter((e) => e.computedStatus === "draft").length,
      ended: eventsWithStatus.filter((e) => e.computedStatus === "ended").length,
    }),
    [events, eventsWithStatus],
  );

  const filtered =
    filter === "all"
      ? eventsWithStatus
      : eventsWithStatus.filter((e) => e.computedStatus === filter);

  const handleToggle = (id: string, currentActive: boolean) => {
    toggleEvent({ id, active: !currentActive });
  };

  const handleEdit = (event: EventType) => {
    setEditingRow(event);
    setOpen(true);
  };

  const openDeleteConfirm = (id: string) => {
    setPendingDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (pendingDeleteId) {
      deleteEvent(pendingDeleteId, {
        onSuccess: () => {
          toast.success("Event deleted");
          setDeleteConfirmOpen(false);
          setPendingDeleteId(null);
        },
        onError: (err) => toast.error(err.message),
      });
    }
  };

  if (isLoading) {
    return <Loader className="min-h-75" />;
  }

  return (
    <>
      <TopBar page="Events" />
      <div className="p-4 sm:p-6">
        <div className="space-y-4 animate-fade-in sm:space-y-6">
          <SectionHeader
            iconClassName="text-white"
            icon={CalendarDays}
            title="Events"
            description="Plan, publish and schedule venue events, and show them on your public page."
            actions={
              <button
                onClick={() => {
                  if (canAddMore) {
                    setEditingRow(null);
                    setOpen(true);
                  } else {
                    toast.error(
                      `Your ${plan} plan allows up to ${getResourceLimitClient(plan, "events")} events. Please upgrade to add more.`,
                    );
                  }
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-background hover:bg-white/90"
              >
                <Plus className="h-3.5 w-3.5" /> New event
              </button>
            }
          />
          <PlanLimitBanner resource="events" currentCount={events.length} warningThreshold={2} />
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
            <StatCard label="All events" value={totals.total} icon={CalendarDays} />
            <StatCard label="Live" value={totals.live} icon={Sparkles} tone="white" />
            <StatCard label="Ended" value={totals.ended} icon={Ticket} />
            <StatCard label="Upcoming" value={totals.upcoming} icon={Clock} tone="amber" />
          </div>

          <div className="flex w-full flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-surface-1 p-1 sm:w-fit">
            {(["all", "live", "draft", "ended"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`flex-1 rounded-lg px-3 py-2 text-xs capitalize transition sm:flex-none sm:py-1.5 ${
                  filter === s
                    ? "bg-white text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="dash-card rounded-2xl border border-dashed border-white/10 bg-surface-1 px-4 py-10 text-center sm:p-12">
              <CalendarDays className="mx-auto h-6 w-6 text-muted-foreground" />
              <h3 className="font-inter-tight mt-3 text-base font-semibold">No events here</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first event to show it on your public page.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {filtered.map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  onEdit={() => handleEdit(e)}
                  onDelete={() => openDeleteConfirm(e.id)}
                  onToggle={() => handleToggle(e.id, e.active)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <EventDialog open={open} setOpen={setOpen} editingRow={editingRow ?? undefined} />
      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete event?"
        description="This action cannot be undone. This will permanently delete the event."
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default Page;
