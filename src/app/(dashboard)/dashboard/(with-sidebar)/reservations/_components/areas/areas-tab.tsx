"use client";

import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import Loader from "@/components/ui/loader";
import { ReservationAreaWithTables } from "@/drizzle/types";
import {
  useDeleteReservationArea,
  useReservationAreas,
} from "@/lib/tanstack-react-query/hooks/reservation-areas";
import { Grid3x3, MapPin, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StatCard } from "../../../../_components";
import AreaDialog from "./area-dialog";

export const AreasTab = () => {
  const { data: areas = [], isPending } = useReservationAreas();
  const deleteMutation = useDeleteReservationArea();

  const [open, setOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<ReservationAreaWithTables | undefined>();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const totals = {
    areas: areas.length,
    tables: areas.reduce((s, a) => s + a.tables.length, 0),
    seats: areas.reduce((s, a) => s + a.tables.reduce((ts, t) => ts + t.seats, 0), 0),
  };

  const openCreate = () => {
    setEditingRow(undefined);
    setOpen(true);
  };

  const openEdit = (area: ReservationAreaWithTables) => {
    setEditingRow(area);
    setOpen(true);
  };

  const openDeleteConfirm = (id: string) => {
    setPendingDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!pendingDeleteId) return;
    deleteMutation.mutate(pendingDeleteId, {
      onSuccess: () => {
        toast.success("Area deleted");
        setDeleteConfirmOpen(false);
        setPendingDeleteId(null);
      },
      onError: (error) => {
        toast.error(error.message);
        setDeleteConfirmOpen(false);
        setPendingDeleteId(null);
      },
    });
  };

  if (isPending) {
    return <Loader className="min-h-75" />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Areas" value={totals.areas} icon={MapPin} tone="white" />
        <StatCard label="Total tables" value={totals.tables} icon={Grid3x3} />
        <StatCard label="Total seats" value={totals.seats} icon={Users} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">Service areas</h2>
          <p className="text-xs text-muted-foreground">
            Group tables into zones for clearer service flow. Capacity is calculated automatically
            from each area&apos;s tables.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 self-start rounded-lg bg-white px-3 text-xs font-semibold text-background hover:bg-white/90 sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" /> Add area
        </button>
      </div>

      {areas.length === 0 ? (
        <div className="dash-card rounded-2xl border border-dashed border-white/10 bg-surface-1 px-4 py-10 text-center sm:p-12">
          <MapPin className="mx-auto h-6 w-6 text-muted-foreground" />
          <h3 className="font-inter-tight mt-3 text-base font-semibold">No areas yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first service area, like a main hall or terrace.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area) => {
            const seats = area.tables.reduce((s, t) => s + t.seats, 0);
            return (
              <div
                key={area.id}
                className="dash-card relative overflow-hidden rounded-2xl border border-white/5 bg-surface-1 p-4"
              >
                <div
                  className={`absolute -top-12 -right-12 h-32 w-32 rounded-full bg-${area.color}/10 blur-2xl`}
                />
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-8 w-8 rounded-xl border border-white/10 bg-${area.color}/15 flex items-center justify-center text-${area.color}`}
                    >
                      <MapPin className="h-4 w-4" />
                    </span>
                    <h3 className="text-sm font-semibold">{area.name}</h3>
                  </div>
                  {area.description && (
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                      {area.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Grid3x3 className="h-3 w-3" /> {area.tables.length} tables
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" /> {seats} seats
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    <button
                      onClick={() => openEdit(area)}
                      className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border border-white/10 bg-background text-[11px] text-muted-foreground hover:border-white/20 hover:text-foreground"
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(area.id)}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-background text-muted-foreground hover:border-danger/30 hover:text-danger"
                      aria-label="Delete area"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AreaDialog open={open} setOpen={setOpen} editingRow={editingRow} />

      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete this area?"
        description="This will permanently delete the area and every table assigned to it. This action cannot be undone."
        onConfirm={confirmDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
};
