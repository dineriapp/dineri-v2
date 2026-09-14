"use client";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { PlanLimitBanner } from "@/components/shared/plan-limit-banner";
import { MenuCategoryWithItems, MenuItemType } from "@/drizzle/types";
import { useAuth } from "@/lib/auth/hooks/use-auth";
import { canAddClient, getResourceLimitClient } from "@/lib/stripe/client";
import {
  useDeleteMenuCategory,
  useDeleteMenuItem,
  useMenuCategoryWithItems,
  useReorderMenuCategories,
  useReorderMenuItems,
  useToggleCategoryVisibility,
  useToggleMenuItemVisibility,
} from "@/lib/tanstack-react-query/hooks/menu";
import { updateSelectedRestaurant, useRestaurantStore } from "@/stores/restaurant-store";
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
  rectSwappingStrategy,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Eye,
  EyeOff,
  ImageIcon,
  LayoutGrid,
  ListIcon,
  LoaderIcon,
  Plus,
  Search,
  Star,
  UtensilsCrossed,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import TopBar from "../../_components/top-bar";
import Loader from "@/components/ui/loader";
import CategoryDialog from "./_components/category-dialog";
import MenuItemDialog from "./_components/menu-item-dialog";
import { SortableCategoryChip } from "./_components/sortable-category-chip";
import { SortableMenuItemCard } from "./_components/sortable-item-card";
import { updateRestaurantMenuStatus } from "./actions";
const Page = () => {
  const { user } = useAuth();
  const { data: rawCategories = [], isPending } = useMenuCategoryWithItems();
  const [isPublishing, startPublishTransition] = useTransition();
  console.log(isPublishing);
  const { selectedRestaurant } = useRestaurantStore();
  const currency = selectedRestaurant?.stripe?.currency ?? "usd";
  const reorderMutation = useReorderMenuCategories();
  const { mutate: deleteCategory, isPending: isDeletingCategory } = useDeleteMenuCategory();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [open, setOpen] = useState(false);
  const [openItemDialog, setOpenItemDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategoryWithItems | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItemType | null>(null);
  const [query, setQuery] = useState("");
  const [published, setPublished] = useState(selectedRestaurant?.is_menu_published ?? false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const { mutate: toggleVisibility } = useToggleMenuItemVisibility();
  const [deleteItemConfirmOpen, setDeleteItemConfirmOpen] = useState(false);
  const [pendingDeleteItemId, setPendingDeleteItemId] = useState<string | null>(null);
  const { mutate: deleteMenuItem, isPending: isDeletingItem } = useDeleteMenuItem();
  const [orderedItems, setOrderedItems] = useState<MenuItemType[]>([]);
  const [hasItemOrderChanged, setHasItemOrderChanged] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const { mutate: reorderItems, isPending: isReorderingItems } = useReorderMenuItems();
  const [orderedCategories, setOrderedCategories] = useState<MenuCategoryWithItems[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { mutate: toggleCategoryVisibility } = useToggleCategoryVisibility();
  const plan = user?.subscription?.plan ?? "starter";
  const canAddMore = canAddClient(plan, "menu", rawCategories.length);

  const stats = useMemo(() => {
    const totalItems = rawCategories.reduce((sum, cat) => sum + cat.items.length, 0);
    const activeCategories = rawCategories.filter((cat) => cat.show_on_public_page).length;
    const featuredItems = rawCategories.reduce(
      (sum, cat) => sum + cat.items.filter((item) => item.tags?.includes("featured")).length,
      0,
    );
    return {
      categories: rawCategories.length,
      totalItems,
      activeCategories,
      featuredItems,
    };
  }, [rawCategories]);

  const handleTogglePublish = useCallback(() => {
    const newValue = !published;

    setPublished(newValue);

    startPublishTransition(async () => {
      const result = await updateRestaurantMenuStatus(newValue);
      if (!result.success) {
        setPublished(!newValue);
        toast.error(result.error || "Failed to update menu status");
      } else {
        toast.success(`Menu ${newValue ? "published" : "unpublished"} successfully`);
        updateSelectedRestaurant({ is_menu_published: newValue });
      }
    });
  }, [published]);

  const handleToggleCategory = (id: string, currentShow: boolean) => {
    toggleCategoryVisibility({ id, show: !currentShow });
  };

  // Sync with API data
  useEffect(() => {
    const sorted = [...rawCategories].sort((a, b) => a.sort_order - b.sort_order);

    setOrderedCategories((prev) => {
      // Check if the order or content changed
      const orderChanged =
        prev.length !== sorted.length ||
        prev.some((cat, i) => cat.id !== sorted[i].id || cat.sort_order !== sorted[i].sort_order);

      if (orderChanged) {
        setHasUnsavedChanges(false); // reset only when order changes
        return sorted;
      }
      return prev; // no change, keep previous state
    });

    // Set initial selected category if none is chosen
    if (sorted.length && !selectedCategoryId) {
      setSelectedCategoryId(sorted[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawCategories]);

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

      const oldIndex = orderedCategories.findIndex((c) => c.id === active.id);
      const newIndex = orderedCategories.findIndex((c) => c.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;

      const newOrder = arrayMove(orderedCategories, oldIndex, newIndex);
      setOrderedCategories(newOrder);
      setHasUnsavedChanges(true);
    },
    [orderedCategories],
  );

  const onDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const handleSaveOrder = () => {
    const payload = orderedCategories.map((cat, idx) => ({
      id: cat.id,
      sort_order: idx,
    }));

    reorderMutation.mutate(payload, {
      onSuccess: () => {
        setHasUnsavedChanges(false);
        toast.success("Category order saved.");
      },
      onError: () => {
        toast.error("Failed to save order.");
      },
    });
  };

  const onItemDragStart = (event: DragStartEvent) => {
    setActiveItemId(event.active.id as string);
  };

  const onItemDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItemId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = orderedItems.findIndex((i) => i.id === active.id);
    const newIndex = orderedItems.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const newOrder = arrayMove(orderedItems, oldIndex, newIndex);
    setOrderedItems(newOrder);
    setHasItemOrderChanged(true);
  };

  const onItemDragCancel = () => setActiveItemId(null);

  const handleSaveItemOrder = () => {
    const payload = orderedItems.map((item, idx) => ({
      id: item.id,
      sort_order: idx,
    }));

    reorderItems(payload, {
      onSuccess: () => {
        setHasItemOrderChanged(false);
        toast.success("Item order saved.");
      },
      onError: () => toast.error("Failed to save item order."),
    });
  };

  const handleToggle = (id: string, show_on_public_page: boolean) => {
    toggleVisibility({
      id: id,
      show: !show_on_public_page,
    });
  };

  const openDeleteConfirm = useCallback((id: string) => {
    setPendingDeleteId(id);
    setDeleteConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (pendingDeleteId) {
      deleteCategory(pendingDeleteId, {
        onSuccess: () => {
          toast.success("Category deleted");
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
  }, [pendingDeleteId, deleteCategory]);

  const openDeleteItemConfirm = useCallback((id: string) => {
    setPendingDeleteItemId(id);
    setDeleteItemConfirmOpen(true);
  }, []);

  const confirmDeleteItem = useCallback(() => {
    if (pendingDeleteItemId) {
      deleteMenuItem(pendingDeleteItemId, {
        onSuccess: () => {
          toast.success("Item deleted");
          setDeleteItemConfirmOpen(false);
          setPendingDeleteItemId(null);
        },
        onError: (error) => {
          toast.error(error.message);
          setDeleteItemConfirmOpen(false);
          setPendingDeleteItemId(null);
        },
      });
    }
  }, [pendingDeleteItemId, deleteMenuItem]);

  const activeCategory = activeId ? orderedCategories.find((c) => c.id === activeId) : undefined;

  const selectedCategory = selectedCategoryId
    ? rawCategories.find((c) => c.id === selectedCategoryId)
    : undefined;

  const filteredItems = useMemo(() => {
    if (!query) return selectedCategory?.items || [];
    const q = query.toLowerCase();
    return (selectedCategory?.items || []).filter(
      (i) => i.name.toLowerCase().includes(q) || i?.description?.toLowerCase().includes(q),
    );
  }, [selectedCategory, query]);

  const canAddMoreItems = canAddClient(
    plan,
    "items_per_category",
    selectedCategory?.items.length || 0,
  );

  useEffect(() => {
    if (!selectedCategory) return;

    const sorted = [...selectedCategory.items].sort((a, b) => a.sort_order - b.sort_order);

    setOrderedItems((prev) => {
      const orderChanged =
        prev.length !== sorted.length ||
        prev.some(
          (item, i) => item.id !== sorted[i].id || item.sort_order !== sorted[i].sort_order,
        );

      if (orderChanged) {
        setHasItemOrderChanged(false);
        return sorted;
      }
      return prev;
    });
  }, [selectedCategory]);

  if (isPending) {
    return <Loader className="min-h-75" />;
  }

  return (
    <>
      <TopBar page="Menu" />
      <div className="p-4 sm:p-6">
        <div className="space-y-4 animate-fade-in sm:space-y-5">
          {/* Header – unchanged */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-inter-tight text-2xl font-semibold tracking-tight lg:text-3xl">
                  Menu
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] ${
                    published
                      ? "border-success/30 bg-success/10 text-success"
                      : "border-white/10 bg-background text-muted-foreground"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${published ? "bg-success animate-pulse" : "bg-muted-foreground"}`}
                  />
                  {published ? "Live" : "Unpublished"}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Craft your menu - drag to reorder, edit, or hide items in real time.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleTogglePublish}
                className={`group inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs transition ${
                  published
                    ? "border-success/30 bg-success/10 text-success hover:bg-success/15"
                    : "border-white/10 bg-background hover:border-white/20"
                }`}
              >
                <span
                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition ${published ? "bg-success" : "bg-white/15"}`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-background transition ${published ? "translate-x-3.5" : "translate-x-0.5"}`}
                  />
                </span>
                {published ? "Published" : "Unpublished"}
              </button>
            </div>
          </div>

          {/* Publish banner  */}
          <div
            className={`flex flex-col items-start justify-between gap-3 rounded-2xl border p-3 sm:p-4 sm:flex-row sm:items-center ${
              published ? "border-success/20 bg-success/5" : "border-warning/20 bg-warning/5"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${published ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}
              >
                {published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </div>
              <div>
                <div className="text-sm font-semibold">
                  {published ? "Your menu is live" : "Your menu is hidden from customers"}
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {published
                    ? "Visitors can browse and order from your public link."
                    : "Customers visiting your link will see a 'Menu temporarily unavailable' notice."}
                </div>
              </div>
            </div>
          </div>
          <PlanLimitBanner
            resource="menu"
            currentCount={rawCategories.length}
            warningThreshold={2}
          />
          {/* Stats  */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
            {[
              { label: "Categories", value: stats.categories, icon: LayoutGrid },
              { label: "Total items", value: stats.totalItems, icon: UtensilsCrossed },
              {
                label: "Active categories",
                value: stats.activeCategories,
                icon: Eye,
                tone: "white",
              },
              { label: "Featured", value: stats.featuredItems, icon: Star, tone: "amber" },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="rounded-2xl border border-white/5 bg-surface-1 p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 ${s.tone === "white" ? "bg-white/10 text-white" : s.tone === "amber" ? "bg-warning/10 text-warning" : "bg-background text-muted-foreground"}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] text-muted-foreground">{s.label}</div>
                  <div className="font-inter-tight mt-0.5 text-xl font-semibold tabular-nums">
                    {s.value}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Categories – Sortable Chip List */}
          <div className="rounded-2xl border border-white/5 bg-surface-1 p-3 sm:p-4">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="font-jetbrains-mono uppercase text-[10px] tracking-wider text-muted-foreground">
                  Categories
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Drag the grip to reorder. Click edit to rename.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {hasUnsavedChanges && (
                  <button
                    onClick={handleSaveOrder}
                    disabled={reorderMutation.isPending}
                    className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-lg bg-white px-2.5 text-[11px] font-semibold text-background hover:bg-white/90 sm:h-8 sm:flex-none"
                  >
                    {reorderMutation.isPending && <LoaderIcon className="animate-spin size-3" />}
                    Save new order
                  </button>
                )}
                <button
                  onClick={() => {
                    if (canAddMore) {
                      setEditingCategory(null);
                      setOpen(true);
                    } else {
                      toast.error(
                        `Your ${plan} plan allows up to ${getResourceLimitClient(plan, "menu")} categories. Please upgrade to add more.`,
                      );
                    }
                  }}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-lg border border-white/10 bg-background px-2.5 text-[11px] hover:border-white/20 sm:h-8 sm:flex-none"
                >
                  <Plus className="h-3 w-3" /> Category
                </button>
              </div>
            </div>

            {orderedCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-7 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
                  <LayoutGrid className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium">No categories yet</h3>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragCancel={onDragCancel}
              >
                <SortableContext
                  items={orderedCategories.map((c) => c.id)}
                  strategy={rectSwappingStrategy}
                >
                  <div className="flex flex-wrap gap-2">
                    {orderedCategories.map((category) => (
                      <SortableCategoryChip
                        key={category.id}
                        category={category}
                        selectedCategoryId={selectedCategoryId}
                        onSelect={() => setSelectedCategoryId(category.id)}
                        onEdit={() => {
                          setEditingCategory(category);
                          setOpen(true);
                        }}
                        onDelete={() => {
                          openDeleteConfirm(category.id);
                          if (selectedCategoryId === category.id) {
                            setSelectedCategoryId(null);
                          }
                        }}
                        onToggle={() =>
                          handleToggleCategory(category.id, category.show_on_public_page)
                        }
                      />
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay dropAnimation={null}>
                  {activeCategory ? (
                    <div className="opacity-95">
                      <SortableCategoryChip
                        category={activeCategory}
                        isDragOverlay
                        selectedCategoryId={selectedCategoryId}
                        onSelect={() => {}}
                        onEdit={() => {}}
                        onDelete={() => {}}
                        onToggle={() => {}}
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </div>

          {selectedCategory && (
            <>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-inter-tight text-lg font-semibold">
                    {selectedCategory.name}
                  </h2>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-muted-foreground tabular-nums">
                    {filteredItems.length} item{filteredItems.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:flex-nowrap">
                  {hasItemOrderChanged && (
                    <button
                      onClick={handleSaveItemOrder}
                      disabled={isReorderingItems}
                      className="inline-flex h-9 items-center gap-1 rounded-lg bg-white px-2.5 text-[11px] font-semibold text-background hover:bg-white/90 sm:h-8"
                    >
                      {isReorderingItems && <LoaderIcon className="animate-spin size-3" />}
                      Save new order
                    </button>
                  )}
                  {filteredItems.length !== 0 && (
                    <button
                      onClick={() => {
                        if (canAddMoreItems) {
                          setEditingItem(null);
                          setOpenItemDialog(true);
                        } else {
                          toast.error(
                            `Your ${plan} plan allows up to ${getResourceLimitClient(plan, "items_per_category")} items per menu. Please upgrade to add more.`,
                          );
                        }
                      }}
                      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-background hover:bg-white/90"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add item
                    </button>
                  )}
                  <div className="flex w-full items-center gap-2 sm:w-auto">
                    <div className="relative flex-1 sm:w-56 sm:flex-none">
                      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search items…"
                        className="h-9 w-full rounded-lg border border-white/10 bg-background pl-8 pr-3 text-base placeholder:text-muted-foreground focus:border-white/40 focus:outline-none sm:text-xs"
                      />
                    </div>

                    <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-white/10 bg-background p-0.5">
                      <button
                        onClick={() => setView("grid")}
                        className={`rounded-md p-2 sm:p-1.5 ${view === "grid" ? "bg-white/10 text-foreground" : "text-muted-foreground"}`}
                        aria-label="Grid view"
                      >
                        <LayoutGrid className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setView("list")}
                        className={`rounded-md p-2 sm:p-1.5 ${view === "list" ? "bg-white/10 text-foreground" : "text-muted-foreground"}`}
                        aria-label="List view"
                      >
                        <ListIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <PlanLimitBanner
                resource="items_per_category"
                currentCount={selectedCategory.items.length}
                warningThreshold={2}
              />
              {/* Items */}
              {filteredItems.length === 0 ? (
                <div className="dash-card rounded-2xl border border-dashed border-white/10 bg-surface-1 px-4 py-10 text-center sm:p-12">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-background">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="font-inter-tight mt-4 text-base font-semibold">No items yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {query
                      ? "Try a different search."
                      : `Add your first item to "${selectedCategory.name}".`}
                  </p>
                  {rawCategories?.length > 0 && (
                    <button
                      onClick={() => {
                        if (canAddMoreItems) {
                          setEditingItem(null);
                          setOpenItemDialog(true);
                        } else {
                          toast.error(
                            `Your ${plan} plan allows up to ${getResourceLimitClient(plan, "items_per_category")} items per menu. Please upgrade to add more.`,
                          );
                        }
                      }}
                      className="inline-flex mt-2 h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-background hover:bg-white/90"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add item
                    </button>
                  )}
                </div>
              ) : view === "grid" ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={onItemDragStart}
                  onDragEnd={onItemDragEnd}
                  onDragCancel={onItemDragCancel}
                >
                  <SortableContext
                    items={orderedItems.map((i) => i.id)}
                    strategy={rectSwappingStrategy} // works with flex-wrap grid
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
                      {orderedItems.map((it) => (
                        <SortableMenuItemCard
                          key={it.id}
                          item={it}
                          view="grid"
                          currency={currency}
                          onEdit={() => {
                            setEditingItem(it);
                            setOpenItemDialog(true);
                          }}
                          onDelete={() => openDeleteItemConfirm(it.id)}
                          onToggle={() => handleToggle(it.id, it.show_on_public_page)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                  <DragOverlay dropAnimation={null}>
                    {activeItemId ? (
                      <div className="opacity-95">
                        <SortableMenuItemCard
                          item={orderedItems.find((i) => i.id === activeItemId)!}
                          view="grid"
                          currency={currency}
                          onEdit={() => {}}
                          onDelete={() => {}}
                          onToggle={() => {}}
                        />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={onItemDragStart}
                  onDragEnd={onItemDragEnd}
                  onDragCancel={onItemDragCancel}
                >
                  <SortableContext
                    items={orderedItems.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {orderedItems.map((it) => (
                        <SortableMenuItemCard
                          key={it.id}
                          item={it}
                          view="list"
                          currency={currency}
                          onEdit={() => {
                            setEditingItem(it);
                            setOpenItemDialog(true);
                          }}
                          onDelete={() => openDeleteItemConfirm(it.id)}
                          onToggle={() => handleToggle(it.id, it.show_on_public_page)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                  <DragOverlay dropAnimation={null}>
                    {activeItemId ? (
                      <div className="opacity-95">
                        <SortableMenuItemCard
                          item={orderedItems.find((i) => i.id === activeItemId)!}
                          view="list"
                          currency={currency}
                          onEdit={() => {}}
                          onDelete={() => {}}
                          onToggle={() => {}}
                        />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              )}
            </>
          )}
        </div>
      </div>

      <CategoryDialog open={open} setOpen={setOpen} editingRow={editingCategory ?? undefined} />

      <MenuItemDialog
        open={openItemDialog}
        setOpen={setOpenItemDialog}
        editingRow={editingItem ?? undefined}
        categoryId={selectedCategoryId ?? undefined}
        categories={rawCategories.map((c) => ({ id: c.id, name: c.name }))}
      />

      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Are you sure?"
        description="This action cannot be undone. This will permanently delete this category and all its items."
        onConfirm={confirmDelete}
        isDeleting={isDeletingCategory}
      />

      <DeleteConfirmDialog
        open={deleteItemConfirmOpen}
        onOpenChange={setDeleteItemConfirmOpen}
        title="Are you sure?"
        description="This action cannot be undone. This will permanently delete the menu item."
        onConfirm={confirmDeleteItem}
        isDeleting={isDeletingItem}
      />
    </>
  );
};

export default Page;
