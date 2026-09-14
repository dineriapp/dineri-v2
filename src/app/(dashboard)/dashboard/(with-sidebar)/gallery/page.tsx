"use client";
import { Tip } from "@/components/ui/tip";

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
import { GalleryType } from "@/drizzle/types";
import {
  useDeleteGalleryItem,
  useReorderGalleryItems,
  useRestaurantGalleryItems,
  useToggleGalleryItemActive,
} from "@/lib/tanstack-react-query/hooks/gallery";
import { getYoutubeId } from "@/lib/validators/zod/gallery.schema";
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
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Eye,
  EyeOff,
  GripVertical,
  Image as ImageIcon,
  LayoutGrid,
  LoaderIcon,
  Pencil,
  Plus,
  Search,
  Trash2,
  Video,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SectionHeader, StatCard } from "../../_components";
import TopBar from "../../_components/top-bar";
import Loader from "@/components/ui/loader";
import GalleryDialog from "./_components/gallery-dialog";
import { PhonePreview } from "./_components/gallery-preview";

const Page = () => {
  const { data: galleryItems = [], isPending } = useRestaurantGalleryItems();
  const reorderMutation = useReorderGalleryItems();
  const toggleMutation = useToggleGalleryItemActive();
  const deleteMutation = useDeleteGalleryItem();

  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState<GalleryType | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [orderedItems, setOrderedItems] = useState<GalleryType[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Prepare sorted items when data loads
  useEffect(() => {
    const sorted = [...galleryItems].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    setOrderedItems(sorted);
    setHasUnsavedChanges(false);
  }, [galleryItems]);

  const hasActiveFilters = !!query;

  const totals = useMemo(
    () => ({
      total: galleryItems.length,
      images: galleryItems.filter((i) => i.type === "image").length,
      videos: galleryItems.filter((i) => i.type === "video").length,
      visible: galleryItems.filter((i) => i.active).length,
    }),
    [galleryItems],
  );

  // Drag & drop sensors
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
      const oldIndex = orderedItems.findIndex((i) => i.id === active.id);
      const newIndex = orderedItems.findIndex((i) => i.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      const newOrder = arrayMove(orderedItems, oldIndex, newIndex);
      setOrderedItems(newOrder);
      setHasUnsavedChanges(true);
    },
    [orderedItems],
  );

  const onDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const handleSaveOrder = () => {
    const payload = orderedItems.map((item, idx) => ({ id: item.id, sort_order: idx }));
    reorderMutation.mutate(payload, {
      onSuccess: () => {
        setHasUnsavedChanges(false);
        toast.success("Gallery order saved.");
      },
      onError: () => toast.error("Failed to save order."),
    });
  };

  const handleAdd = () => {
    setEditingGallery(null);
    setOpen(true);
  };

  const handleEdit = (item: GalleryType) => {
    setEditingGallery({ ...item });
    setOpen(true);
  };

  const handleToggle = (id: string, active: boolean) => {
    toggleMutation.mutate({ id, active });
  };

  const openDeleteConfirm = (id: string) => {
    setPendingDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (pendingDeleteId) {
      deleteMutation.mutate(pendingDeleteId, {
        onSuccess: () => {
          toast.success("Gallery item deleted");
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
  };

  const activeItem = activeId ? orderedItems.find((i) => i.id === activeId) : null;

  // Compute display items (always filtered by type + search)
  const displayItems = useMemo(() => {
    let items = hasActiveFilters ? galleryItems : orderedItems;
    if (filter !== "all") {
      items = items.filter((i) => i.type === filter);
    }
    if (query) {
      const q = query.toLowerCase();
      items = items.filter((i) => i.title?.toLowerCase().includes(q));
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasActiveFilters ? galleryItems : orderedItems, filter, query]);

  const isDraggable = filter === "all" && !query;

  if (isPending) {
    return <Loader className="min-h-75" />;
  }

  return (
    <>
      <TopBar page="Gallery" />
      <div className="p-4 sm:p-6">
        <div className="space-y-4 animate-fade-in sm:space-y-6">
          <SectionHeader
            iconClassName="text-white"
            icon={LayoutGrid}
            title="Gallery"
            description="Curate a Linktree-style grid of photos and videos. Drag tiles to rearrange - top-left appears first."
            actions={
              <button
                onClick={handleAdd}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-background hover:bg-white/90"
              >
                <Plus className="h-3.5 w-3.5" /> Add tile
              </button>
            }
          />

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
            <StatCard label="Total tiles" value={totals.total} icon={LayoutGrid} />
            <StatCard label="Images" value={totals.images} icon={ImageIcon} />
            <StatCard label="Videos" value={totals.videos} icon={Video} />
            <StatCard label="Visible" value={totals.visible} icon={Eye} tone="white" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex w-fit items-center gap-1 rounded-xl border border-white/10 bg-surface-1 p-1">
              {(["all", "image", "video"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`rounded-lg px-3 py-2 text-xs capitalize transition sm:py-1.5 ${
                    filter === s
                      ? "bg-white text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s === "all" ? "All" : s + "s"}
                </button>
              ))}
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
              <div className="relative min-w-0 flex-1 sm:w-56 sm:flex-none">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by title…"
                  className="h-9 w-full rounded-lg border border-white/10 bg-background pl-8 pr-3 text-base focus:border-white/40 focus:outline-none sm:text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[1fr_320px]">
            <div className="rounded-2xl border border-white/5 bg-surface-1 p-3 sm:p-4">
              {displayItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center sm:p-10">
                  <ImageIcon className="mx-auto h-5 w-5 text-muted-foreground" />
                  <h3 className="font-inter-tight mt-3 text-base font-semibold">No items found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try a different filter or add your first tile.
                  </p>
                </div>
              ) : isDraggable ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onDragCancel={onDragCancel}
                >
                  <SortableContext
                    items={orderedItems.map((i) => i.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-3 sm:gap-4">
                      {orderedItems.map((item) => (
                        <SortableGalleryTile
                          key={item.id}
                          item={item}
                          isToggleDisabled={toggleMutation.isPending}
                          isDeleteDisabled={deleteMutation.isPending}
                          onToggle={() => handleToggle(item.id, !item.active)}
                          onEdit={() => handleEdit(item)}
                          onDelete={() => openDeleteConfirm(item.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                  <DragOverlay dropAnimation={null}>
                    {activeItem && (
                      <div className="opacity-95">
                        <GalleryTile
                          item={activeItem}
                          isDragOverlay
                          isToggleDisabled={toggleMutation.isPending}
                          isDeleteDisabled={deleteMutation.isPending}
                          onToggle={() => {}}
                          onEdit={() => {}}
                          onDelete={() => {}}
                        />
                      </div>
                    )}
                  </DragOverlay>
                </DndContext>
              ) : (
                <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-3 sm:gap-4">
                  {displayItems.map((item) => (
                    <GalleryTile
                      key={item.id}
                      item={item}
                      isDragDisabled
                      isToggleDisabled={toggleMutation.isPending}
                      isDeleteDisabled={deleteMutation.isPending}
                      onToggle={() => handleToggle(item.id, !item.active)}
                      onEdit={() => handleEdit(item)}
                      onDelete={() => openDeleteConfirm(item.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            <PhonePreview items={galleryItems} />
          </div>
        </div>
      </div>

      <GalleryDialog open={open} setOpen={setOpen} editingRow={editingGallery ?? undefined} />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the gallery item.
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

// ----------------------------------------------------------------------
// Sortable tile component (wraps GalleryTile with dnd-kit)
// ----------------------------------------------------------------------
const SortableGalleryTile = ({
  item,
  onToggle,
  onEdit,
  onDelete,
  isToggleDisabled,
  isDeleteDisabled,
}: {
  item: GalleryType;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isToggleDisabled?: boolean;
  isDeleteDisabled?: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <GalleryTile
        item={item}
        dragHandleProps={{ ...attributes, ...listeners }}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
        isToggleDisabled={isToggleDisabled}
        isDeleteDisabled={isDeleteDisabled}
      />
    </div>
  );
};

// ----------------------------------------------------------------------
// Base tile (visual only)
// ----------------------------------------------------------------------
const GalleryTile = ({
  item,
  dragHandleProps,
  onToggle,
  onEdit,
  onDelete,
  isToggleDisabled,
  isDeleteDisabled,
  isDragOverlay = false,
  isDragDisabled = false,
}: {
  item: GalleryType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragHandleProps?: any;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isToggleDisabled?: boolean;
  isDeleteDisabled?: boolean;
  isDragOverlay?: boolean;
  isDragDisabled?: boolean;
}) => {
  return (
    <div
      className={`group relative touch-none overflow-hidden rounded-2xl border border-white/5 bg-surface-1 transition hover:border-white/15 ${
        !item.active ? "opacity-60" : ""
      } ${isDragOverlay ? "shadow-2xl ring-2 ring-white" : ""}`}
    >
      {/* Drag handle */}
      {!isDragDisabled && dragHandleProps && (
        <Tip label="Drag to reorder" side="right">
          <button
            {...dragHandleProps}
            className="absolute left-2 top-2 z-10 rounded-md bg-background/80 p-1.5 text-muted-foreground opacity-100 backdrop-blur transition cursor-grab active:cursor-grabbing sm:p-1 sm:opacity-0 sm:group-hover:opacity-100"
            aria-label="Drag tile"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        </Tip>
      )}

      {/* Type chip */}
      <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur">
        {item.type === "image" ? (
          <ImageIcon className="h-2.5 w-2.5" />
        ) : (
          <Video className="h-2.5 w-2.5" />
        )}
        {item.type}
      </span>

      {/* Media preview */}
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-linear-to-br from-white/15 via-emerald-500/5 to-transparent">
        {item.type === "image" ? (
          item.image?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image.url} alt={item.image.key} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-10 w-10 text-muted-foreground opacity-40" />
          )
        ) : (
          (() => {
            const youtubeId = getYoutubeId(item.youtube_url ?? "");
            const hasYoutubeId = !!youtubeId;
            const youtubeThumbnail = hasYoutubeId
              ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
              : null;
            const customPoster = item.image?.url;
            const thumbToShow = customPoster || youtubeThumbnail;
            return thumbToShow ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbToShow}
                  alt="Video thumbnail"
                  className="h-full w-full object-cover"
                />
              </>
            ) : (
              <Video className="h-10 w-10 text-muted-foreground opacity-40" />
            );
          })()
        )}
        {!item.active && (
          <Tip label="Not shown on your public page">
            <span className="absolute bottom-2 left-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] text-muted-foreground backdrop-blur">
              Hidden
            </span>
          </Tip>
        )}
      </div>

      {/* Title and actions */}
      <div className="p-3">
        <Tip label={item.title || "Untitled"}>
          <h4 className="truncate text-sm font-semibold leading-tight">
            {item.title || "Untitled"}
          </h4>
        </Tip>
        <div className="mt-2 flex items-center justify-end gap-0.5">
          <Tip label={item.active ? "Hide from public page" : "Show on public page"}>
            <button
              onClick={onToggle}
              disabled={isToggleDisabled}
              className="rounded-md p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground disabled:opacity-50 sm:p-1.5"
              aria-label="Toggle active"
            >
              {item.active ? (
                <Eye className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              ) : (
                <EyeOff className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              )}
            </button>
          </Tip>
          <Tip label="Edit tile">
            <button
              onClick={onEdit}
              className="rounded-md p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground sm:p-1.5"
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </button>
          </Tip>
          <Tip label="Delete tile">
            <button
              onClick={onDelete}
              disabled={isDeleteDisabled}
              className="rounded-md p-2 text-muted-foreground hover:bg-danger/10 hover:text-danger disabled:opacity-50 sm:p-1.5"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </button>
          </Tip>
        </div>
      </div>
    </div>
  );
};
