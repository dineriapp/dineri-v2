"use client";
import { PlanLimitBanner } from "@/components/shared/plan-limit-banner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LinkType } from "@/drizzle/types";
import { useAuth } from "@/lib/auth/hooks/use-auth";
import { canAddClient, getResourceLimitClient } from "@/lib/stripe/client";
import {
  useDeleteRestaurantLink,
  useReorderRestaurantLinks,
  useRestaurantLinks,
  useToggleRestaurantLink,
} from "@/lib/tanstack-react-query/hooks/links";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ExternalLink,
  Eye,
  Link as LinkIcon,
  LoaderIcon,
  MousePointerClick,
  Plus,
  Search,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SectionHeader, StatCard } from "../../_components";
import TopBar from "../../_components/top-bar";
import Loader from "@/components/ui/loader";
import LinkDialog from "./_components/link-dialog";
import { LinkRow } from "./_components/link-row";

const Page = () => {
  const { user } = useAuth();
  const { data: links = [], isPending } = useRestaurantLinks();
  const reorderMutation = useReorderRestaurantLinks();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [editingRow, setEditingRow] = useState<LinkType | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [orderedLinks, setOrderedLinks] = useState<LinkType[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const toggleMutation = useToggleRestaurantLink();
  const deleteMutation = useDeleteRestaurantLink();
  const plan = user?.subscription?.plan ?? "starter";
  const canAddMore = canAddClient(plan, "links", links.length);
  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const sorted = [...links].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    setOrderedLinks(sorted);
    setHasUnsavedChanges(false);
  }, [links]);

  const hasActiveFilters = !!query;
  const sourceLinks = hasActiveFilters ? links : orderedLinks;

  const filtered = useMemo(() => {
    if (!query) return sourceLinks;
    const q = query.toLowerCase();
    return sourceLinks.filter(
      (r) => r.title.toLowerCase().includes(q) || r.url.toLowerCase().includes(q),
    );
  }, [sourceLinks, query]);

  const totals = useMemo(() => {
    const best = [...links].sort((a, b) => b.clicks - a.clicks)[0];
    return {
      total: links.length,
      active: links.filter((r) => r.active).length,
      clicks: links.reduce((s, r) => s + r.clicks, 0),
      best: best?.title ?? "-",
      bestClicks: best?.clicks ?? 0,
    };
  }, [links]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      if (!over || active.id === over.id) return;
      const oldIndex = orderedLinks.findIndex((r) => r.id === active.id);
      const newIndex = orderedLinks.findIndex((r) => r.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      const newOrder = arrayMove(orderedLinks, oldIndex, newIndex);
      // Optimistic update – instantly moves, no API call yet
      setOrderedLinks(newOrder);
      setHasUnsavedChanges(true);
    },
    [orderedLinks],
  );

  const onDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const handleSaveOrder = () => {
    const payload = orderedLinks.map((link, idx) => ({ id: link.id, sort_order: idx }));
    reorderMutation.mutate(payload, {
      onSuccess: () => {
        setHasUnsavedChanges(false);
        toast.success("Link order saved successfully.");
      },
      onError: () => {
        toast.error("Failed to save order. Please try again.");
      },
    });
  };

  const handleAddLink = useCallback(() => {
    setEditingRow(null);
    setOpen(true);
  }, []);

  const handleEditLink = useCallback((row: LinkType) => {
    setEditingRow({ ...row });
    setOpen(true);
  }, []);

  const handleToggleLink = useCallback(
    (id: string, active: boolean) => {
      toggleMutation.mutate({ id, active });
    },
    [toggleMutation],
  );

  const handleCopyUrl = useCallback((url: string) => {
    navigator.clipboard?.writeText(url);
    toast("URL copied");
  }, []);

  const openDeleteConfirm = useCallback((id: string) => {
    setPendingDeleteId(id);
    setDeleteConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (pendingDeleteId) {
      deleteMutation.mutate(pendingDeleteId, {
        onSuccess: () => {
          toast.success("Link deleted");
          setDeleteConfirmOpen(false);
          setPendingDeleteId(null);
        },
        onError: (error) => {
          toast.error(error.message);
          setDeleteConfirmOpen(false);
          setPendingDeleteId(null);
        },
      });
    }
  }, [pendingDeleteId, deleteMutation]);

  const activeLink = activeId ? orderedLinks.find((r) => r.id === activeId) : null;

  if (isPending) {
    return <Loader className="min-h-75" />;
  }

  return (
    <>
      <TopBar page="Links" />
      <div className="p-4 sm:p-6">
        <div className="space-y-4 animate-fade-in sm:space-y-5">
          <SectionHeader
            icon={LinkIcon}
            iconClassName="text-white"
            title="Links"
            description="Curate the links that appear on your public Dineri page. Drag to reorder, hide what you don't need, and track clicks."
            actions={
              <button
                onClick={() => {
                  if (canAddMore) {
                    handleAddLink();
                  } else {
                    toast.error(
                      `Your ${plan} plan allows up to ${getResourceLimitClient(plan, "links")} links. Please upgrade to add more.`,
                    );
                  }
                }}
                className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-background bg-white hover:bg-white/90`}
              >
                <Plus className="h-3.5 w-3.5" /> Add link
              </button>
            }
          />
          <PlanLimitBanner resource="links" currentCount={links.length} warningThreshold={2} />
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
            <StatCard label="Total links" value={totals.total} icon={LinkIcon} />
            <StatCard label="Active" value={totals.active} icon={Eye} tone="white" />
            <StatCard
              label="Total clicks"
              value={totals.clicks.toLocaleString()}
              icon={MousePointerClick}
              hint={totals.clicks > 0 ? "all time" : undefined}
            />
            <StatCard
              label="Top link"
              value={totals.best}
              icon={TrendingUp}
              tone="amber"
              hint={
                totals.bestClicks > 0 ? `${totals.bestClicks.toLocaleString()} clicks` : undefined
              }
            />
          </div>
          <div className="rounded-2xl border border-white/5 bg-surface-1 p-3 sm:p-4">
            {/* Toolbar with Save button */}
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="font-jetbrains-mono uppercase text-[10px] tracking-wider text-muted-foreground">
                  Your links
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Order matters - top of the list appears first on your public page.
                </p>
              </div>
              <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
                {!hasActiveFilters && hasUnsavedChanges && (
                  <button
                    onClick={handleSaveOrder}
                    disabled={reorderMutation.isPending}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-background hover:bg-white/90 sm:h-8"
                  >
                    {reorderMutation.isPending && <LoaderIcon className="animate-spin size-3" />}
                    Save new order
                  </button>
                )}
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search…"
                    className="h-9 w-full rounded-lg border border-white/10 bg-background pl-8 pr-3 text-base focus:border-white/40 focus:outline-none sm:text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Drag & Drop Area */}
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center sm:p-10">
                <ExternalLink className="mx-auto h-5 w-5 text-muted-foreground" />
                <h3 className="font-inter-tight mt-3 text-base font-semibold">No links found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try a different search or add a new link.
                </p>
              </div>
            ) : hasActiveFilters ? (
              // Non‑draggable filtered list
              <div className="space-y-2">
                {filtered.map((r) => (
                  <LinkRow
                    key={r.id}
                    row={r}
                    topClicks={totals.bestClicks}
                    isDragDisabled
                    isToggleDisabled={toggleMutation.isPending}
                    isDeleteDisabled={deleteMutation.isPending}
                    onToggle={() => handleToggleLink(r.id, !r.active)}
                    onEdit={() => handleEditLink(r)}
                    onDelete={() => openDeleteConfirm(r.id)}
                    onCopy={() => handleCopyUrl(r.url)}
                  />
                ))}
              </div>
            ) : (
              <div>
                <div>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onDragCancel={onDragCancel}
                    modifiers={[restrictToVerticalAxis]}
                  >
                    <SortableContext
                      items={orderedLinks.map((r) => r.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {orderedLinks.map((r) => (
                          <LinkRow
                            key={r.id}
                            row={r}
                            topClicks={totals.bestClicks}
                            isToggleDisabled={toggleMutation.isPending}
                            isDeleteDisabled={deleteMutation.isPending}
                            onToggle={() => handleToggleLink(r.id, !r.active)}
                            onEdit={() => handleEditLink(r)}
                            onDelete={() => openDeleteConfirm(r.id)}
                            onCopy={() => handleCopyUrl(r.url)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                    <DragOverlay dropAnimation={null}>
                      {activeLink ? (
                        <div className="opacity-95">
                          <LinkRow row={activeLink} isDragOverlay />
                        </div>
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                </div>
              </div>
            )}
          </div>
          <LinkDialog open={open} setOpen={setOpen} editingRow={editingRow ?? undefined} />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-danger text-destructive-foreground hover:bg-danger/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Page;
