"use client";

import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import Loader from "@/components/ui/loader";
import { ReservationTableType } from "@/drizzle/types";
import { useReservationAreas } from "@/lib/tanstack-react-query/hooks/reservation-areas";
import {
  useDeleteReservationTable,
  useToggleReservationTable,
} from "@/lib/tanstack-react-query/hooks/reservation-tables";
import { Grid3x3, MapPin, Pencil, Plus, Power, Search, Trash2, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DashSelect, StatCard } from "../../../../_components";
import TableDialog from "./table-dialog";

export const TablesTab = () => {
  const { data: areas = [], isPending } = useReservationAreas();
  const deleteMutation = useDeleteReservationTable();
  const toggleMutation = useToggleReservationTable();

  const [open, setOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<ReservationTableType | undefined>();
  const [defaultAreaId, setDefaultAreaId] = useState<string | undefined>();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [filterArea, setFilterArea] = useState<string>("all");

  const allTables = useMemo(() => areas.flatMap((a) => a.tables), [areas]);

  const totals = {
    tables: allTables.length,
    seats: allTables.reduce((s, t) => s + t.seats, 0),
    active: allTables.filter((t) => t.active).length,
  };

  const visibleAreas = filterArea === "all" ? areas : areas.filter((a) => a.id === filterArea);

  const filterTables = (tables: ReservationTableType[]) =>
    tables.filter((t) => (query ? t.label.toLowerCase().includes(query.toLowerCase()) : true));

  const openCreate = (areaId?: string) => {
    setEditingRow(undefined);
    setDefaultAreaId(areaId);
    setOpen(true);
  };

  const openEdit = (table: ReservationTableType) => {
    setEditingRow(table);
    setDefaultAreaId(undefined);
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
        toast.success("Table deleted");
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
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total tables" value={totals.tables} icon={Grid3x3} tone="white" />
        <StatCard label="Total seats" value={totals.seats} icon={Users} />
        <StatCard
          label="Active"
          value={`${totals.active}/${totals.tables}`}
          icon={Power}
          tone={totals.active === totals.tables && totals.tables > 0 ? "white" : "default"}
        />
      </div>

      {areas.length === 0 ? (
        <div className="dash-card rounded-2xl border border-dashed border-white/10 bg-surface-1 px-4 py-10 text-center sm:p-12">
          <MapPin className="mx-auto h-6 w-6 text-muted-foreground" />
          <h3 className="font-inter-tight mt-3 text-base font-semibold">Create an area first</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Tables belong to an area - add one in the Areas tab before adding tables.
          </p>
        </div>
      ) : (
        <>
          <div className="dash-card flex flex-wrap items-center gap-2 rounded-2xl border border-white/5 bg-surface-1 p-3">
            <div className="relative flex-1 min-w-50">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a table…"
                className="h-10 w-full rounded-xl border border-white/10 bg-background pl-9 pr-3 text-sm outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20"
              />
            </div>
            <DashSelect
              value={filterArea}
              onValueChange={setFilterArea}
              ariaLabel="Filter area"
              size="md"
              className="h-10 min-w-40"
              options={[
                { value: "all", label: "All areas" },
                ...areas.map((a) => ({ value: a.id, label: a.name })),
              ]}
            />
            <button
              onClick={() => openCreate(filterArea !== "all" ? filterArea : undefined)}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-xs font-semibold text-background hover:bg-white/90"
            >
              <Plus className="h-3.5 w-3.5" /> Add table
            </button>
          </div>

          {visibleAreas.map((area) => {
            const list = filterTables(area.tables);
            const seatsInArea = area.tables.reduce((s, t) => s + t.seats, 0);
            return (
              <div
                key={area.id}
                className="dash-card rounded-2xl border border-white/5 bg-surface-1 p-5"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-9 w-9 rounded-xl border border-white/10 bg-${area.color}/15 flex items-center justify-center`}
                    >
                      <MapPin className={`h-4 w-4 text-${area.color}`} />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold">{area.name}</h3>
                      <div className="font-jetbrains-mono uppercase text-[10px] tracking-wider text-muted-foreground">
                        {area.tables.length} tables · {seatsInArea} seats
                      </div>
                    </div>
                  </div>
                </div>
                {list.length === 0 ? (
                  <div className="px-4 py-10 text-center text-xs text-muted-foreground">
                    No tables match the filters.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
                    {list.map((t) => (
                      <div
                        key={t.id}
                        className={`group relative flex flex-col items-center justify-center gap-1 rounded-2xl border p-3 text-center transition ${
                          t.active
                            ? "border-white/10 bg-background"
                            : "border-dashed border-white/10 bg-background/50 opacity-60"
                        }`}
                      >
                        <span className="font-inter-tight text-base font-semibold">{t.label}</span>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Users className="h-2.5 w-2.5" /> {t.seats} seats
                        </div>
                        <button
                          onClick={() => toggleMutation.mutate({ id: t.id, active: !t.active })}
                          className={`mt-1 inline-flex h-5 items-center rounded-full border px-2 text-[9px] uppercase tracking-wider transition ${
                            t.active
                              ? "border-white/30 bg-white/10 text-white"
                              : "border-white/10 bg-background text-muted-foreground"
                          }`}
                        >
                          {t.active ? "Active" : "Inactive"}
                        </button>
                        <div className="mt-1.5 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                          <button
                            onClick={() => openEdit(t)}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-white/5 hover:text-foreground"
                            aria-label="Edit table"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => openDeleteConfirm(t.id)}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-danger/10 hover:text-danger"
                            aria-label="Delete table"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      <TableDialog
        open={open}
        setOpen={setOpen}
        editingRow={editingRow}
        areas={areas}
        defaultAreaId={defaultAreaId}
      />

      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete this table?"
        description="This action cannot be undone. This will permanently delete the table."
        onConfirm={confirmDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
};
