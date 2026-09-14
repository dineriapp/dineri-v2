"use client";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { PlanLimitBanner } from "@/components/shared/plan-limit-banner";
import Loader from "@/components/ui/loader";
import { FaqCategoryWithItems, FaqType } from "@/drizzle/types";
import { useAuth } from "@/lib/auth/hooks/use-auth";
import { canAddClient, getResourceLimitClient } from "@/lib/stripe/client";
import {
  useDeleteFaq,
  useDeleteFaqCategory,
  useFaqCategoryWithItems,
  useReorderFaqCategories,
  useReorderFaqs,
  useToggleFaq,
  useToggleFaqCategoryActive,
} from "@/lib/tanstack-react-query/hooks/faq";
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
import { Eye, HelpCircle, ListChecks, LoaderIcon, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SectionHeader, StatCard } from "../../_components";
import TopBar from "../../_components/top-bar";
import FaqCategoryDialog from "./_components/faq-category-dialog";
import FaqDialog from "./_components/faq-dialog";
import { SortableFaqItem } from "./_components/faq-sortable-item";
import { SortableFaqCategoryChip } from "./_components/sortable-faq-category-chip";

const Page = () => {
  const { user } = useAuth();
  const { data: rawCategories = [], isPending } = useFaqCategoryWithItems();

  const [open, setOpen] = useState(false);
  const [openFaqDialog, setOpenFaqDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FaqCategoryWithItems | null>(null);
  const [editingFaq, setEditingFaq] = useState<FaqType | null>(null);
  const [query, setQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteFaqConfirmOpen, setDeleteFaqConfirmOpen] = useState(false);
  const [pendingDeleteFaqId, setPendingDeleteFaqId] = useState<string | null>(null);

  const [orderedCategories, setOrderedCategories] = useState<FaqCategoryWithItems[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [orderedFaqs, setOrderedFaqs] = useState<FaqType[]>([]);
  const [hasFaqOrderChanged, setHasFaqOrderChanged] = useState(false);
  const [activeFaqId, setActiveFaqId] = useState<string | null>(null);

  const reorderMutation = useReorderFaqCategories();
  const { mutate: deleteCategory, isPending: isDeletingCategory } = useDeleteFaqCategory();
  const { mutate: toggleCategoryActive } = useToggleFaqCategoryActive();
  const { mutate: toggleFaq } = useToggleFaq();
  const { mutate: deleteFaq, isPending: isDeletingFaq } = useDeleteFaq();
  const { mutate: reorderFaqs, isPending: isReorderingFaqs } = useReorderFaqs();

  const plan = user?.subscription?.plan ?? "starter";
  const canAddMore = canAddClient(plan, "faq", rawCategories.length);

  const stats = useMemo(() => {
    const totalFaqs = rawCategories.reduce((sum, cat) => sum + cat.items.length, 0);
    const visibleFaqs = rawCategories.reduce(
      (sum, cat) => sum + cat.items.filter((f) => f.active).length,
      0,
    );
    return {
      categories: rawCategories.length,
      totalFaqs,
      visibleFaqs,
    };
  }, [rawCategories]);

  // Sync with API data
  useEffect(() => {
    const sorted = [...rawCategories].sort((a, b) => a.sort_order - b.sort_order);
    setOrderedCategories(sorted);
    setHasUnsavedChanges(false);
    if (sorted.length && !selectedCategoryId) setSelectedCategoryId(sorted[0].id);
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

      setOrderedCategories(arrayMove(orderedCategories, oldIndex, newIndex));
      setHasUnsavedChanges(true);
    },
    [orderedCategories],
  );

  const onDragCancel = useCallback(() => setActiveId(null), []);

  const handleSaveOrder = () => {
    const payload = orderedCategories.map((cat, idx) => ({ id: cat.id, sort_order: idx }));
    reorderMutation.mutate(payload, {
      onSuccess: () => {
        setHasUnsavedChanges(false);
        toast.success("Category order saved.");
      },
      onError: () => toast.error("Failed to save order."),
    });
  };

  const onFaqDragStart = (event: DragStartEvent) => setActiveFaqId(event.active.id as string);

  const onFaqDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveFaqId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = orderedFaqs.findIndex((i) => i.id === active.id);
    const newIndex = orderedFaqs.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    setOrderedFaqs(arrayMove(orderedFaqs, oldIndex, newIndex));
    setHasFaqOrderChanged(true);
  };

  const onFaqDragCancel = () => setActiveFaqId(null);

  const handleSaveFaqOrder = () => {
    const payload = orderedFaqs.map((faq, idx) => ({ id: faq.id, sort_order: idx }));
    reorderFaqs(payload, {
      onSuccess: () => {
        setHasFaqOrderChanged(false);
        toast.success("Question order saved.");
      },
      onError: () => toast.error("Failed to save question order."),
    });
  };

  const handleToggleCategory = (id: string, currentActive: boolean) => {
    toggleCategoryActive({ id, active: !currentActive });
  };

  const handleToggle = (id: string, active: boolean) => {
    toggleFaq({ id, active: !active });
  };

  const openDeleteConfirm = useCallback((id: string) => {
    setPendingDeleteId(id);
    setDeleteConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!pendingDeleteId) return;
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
  }, [pendingDeleteId, deleteCategory]);

  const openDeleteFaqConfirm = useCallback((id: string) => {
    setPendingDeleteFaqId(id);
    setDeleteFaqConfirmOpen(true);
  }, []);

  const confirmDeleteFaq = useCallback(() => {
    if (!pendingDeleteFaqId) return;
    deleteFaq(pendingDeleteFaqId, {
      onSuccess: () => {
        toast.success("Question deleted");
        setDeleteFaqConfirmOpen(false);
        setPendingDeleteFaqId(null);
      },
      onError: (error) => {
        toast.error(error.message);
        setDeleteFaqConfirmOpen(false);
        setPendingDeleteFaqId(null);
      },
    });
  }, [pendingDeleteFaqId, deleteFaq]);

  const activeCategory = activeId ? orderedCategories.find((c) => c.id === activeId) : undefined;

  const selectedCategory = selectedCategoryId
    ? rawCategories.find((c) => c.id === selectedCategoryId)
    : undefined;

  const filteredFaqs = useMemo(() => {
    if (!query) return selectedCategory?.items ?? [];
    const q = query.toLowerCase();
    return (selectedCategory?.items ?? []).filter(
      (f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q),
    );
  }, [selectedCategory, query]);

  const canAddMoreFaqs = canAddClient(
    plan,
    "items_per_category",
    selectedCategory?.items.length || 0,
  );

  useEffect(() => {
    if (selectedCategory) {
      const sorted = [...selectedCategory.items].sort((a, b) => a.sort_order - b.sort_order);
      setOrderedFaqs(sorted);
      setHasFaqOrderChanged(false);
    }
  }, [selectedCategory]);

  const isFiltered = query !== "";
  const displayFaqs = isFiltered ? filteredFaqs : orderedFaqs;

  if (isPending) {
    return <Loader className="min-h-75" />;
  }

  return (
    <>
      <TopBar page="FAQ" />
      <div className="p-4 sm:p-6">
        <div className="space-y-4 animate-fade-in sm:space-y-5">
          <SectionHeader
            iconClassName="text-white"
            icon={HelpCircle}
            title="FAQs"
            description="Answer the questions customers ask most. Group by topic, drag to reorder, hide what's outdated."
          />

          <PlanLimitBanner
            resource="faq"
            currentCount={rawCategories.length}
            warningThreshold={2}
          />

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
            <StatCard label="Topics" value={stats.categories} icon={ListChecks} />
            <StatCard label="Questions" value={stats.totalFaqs} icon={HelpCircle} />
            <StatCard label="Visible" value={stats.visibleFaqs} icon={Eye} tone="white" />
          </div>

          {/* Categories - Sortable Chip List */}
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
                        `Your ${plan} plan allows up to ${getResourceLimitClient(plan, "faq")} categories. Please upgrade to add more.`,
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
                  <ListChecks className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium">No categories yet</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Add a category before you add questions.
                </p>
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
                      <SortableFaqCategoryChip
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
                        onToggle={() => handleToggleCategory(category.id, category.active)}
                      />
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay dropAnimation={null}>
                  {activeCategory ? (
                    <div className="opacity-95">
                      <SortableFaqCategoryChip
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
                    {displayFaqs.length} question{displayFaqs.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:flex-nowrap">
                  {!isFiltered && hasFaqOrderChanged && (
                    <button
                      onClick={handleSaveFaqOrder}
                      disabled={isReorderingFaqs}
                      className="inline-flex h-9 items-center gap-1 rounded-lg bg-white px-2.5 text-[11px] font-semibold text-background hover:bg-white/90 sm:h-8"
                    >
                      {isReorderingFaqs && <LoaderIcon className="animate-spin size-3" />}
                      Save new order
                    </button>
                  )}
                  {displayFaqs.length !== 0 && (
                    <button
                      onClick={() => {
                        if (canAddMoreFaqs) {
                          setEditingFaq(null);
                          setOpenFaqDialog(true);
                        } else {
                          toast.error(
                            `Your ${plan} plan allows up to ${getResourceLimitClient(plan, "items_per_category")} questions per category. Please upgrade to add more.`,
                          );
                        }
                      }}
                      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-background hover:bg-white/90"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add question
                    </button>
                  )}
                  <div className="relative min-w-0 flex-1 sm:w-56 sm:flex-none">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search questions…"
                      className="h-9 w-full rounded-lg border border-white/10 bg-background pl-8 pr-3 text-base placeholder:text-muted-foreground focus:border-white/40 focus:outline-none sm:text-xs"
                    />
                  </div>
                </div>
              </div>

              <PlanLimitBanner
                resource="items_per_category"
                currentCount={selectedCategory.items.length}
                warningThreshold={2}
              />

              {/* Questions */}
              {displayFaqs.length === 0 ? (
                <div className="dash-card rounded-2xl border border-dashed border-white/10 bg-surface-1 px-4 py-10 text-center sm:p-12">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-background">
                    <HelpCircle className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="font-inter-tight mt-4 text-base font-semibold">
                    No questions yet
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {query
                      ? "Try a different search."
                      : `Add your first question to "${selectedCategory.name}".`}
                  </p>
                  {!query && (
                    <button
                      onClick={() => {
                        if (canAddMoreFaqs) {
                          setEditingFaq(null);
                          setOpenFaqDialog(true);
                        } else {
                          toast.error(
                            `Your ${plan} plan allows up to ${getResourceLimitClient(plan, "items_per_category")} questions per category. Please upgrade to add more.`,
                          );
                        }
                      }}
                      className="inline-flex mt-2 h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-background hover:bg-white/90"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add question
                    </button>
                  )}
                </div>
              ) : isFiltered ? (
                <div className="space-y-2">
                  {displayFaqs.map((faq) => (
                    <SortableFaqItem
                      key={faq.id}
                      faq={faq}
                      isFiltered
                      onEdit={() => {
                        setEditingFaq(faq);
                        setOpenFaqDialog(true);
                      }}
                      onDelete={() => openDeleteFaqConfirm(faq.id)}
                      onToggle={() => handleToggle(faq.id, faq.active)}
                    />
                  ))}
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={onFaqDragStart}
                  onDragEnd={onFaqDragEnd}
                  onDragCancel={onFaqDragCancel}
                >
                  <SortableContext
                    items={orderedFaqs.map((f) => f.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {orderedFaqs.map((faq) => (
                        <SortableFaqItem
                          key={faq.id}
                          faq={faq}
                          onEdit={() => {
                            setEditingFaq(faq);
                            setOpenFaqDialog(true);
                          }}
                          onDelete={() => openDeleteFaqConfirm(faq.id)}
                          onToggle={() => handleToggle(faq.id, faq.active)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                  <DragOverlay dropAnimation={null}>
                    {activeFaqId ? (
                      <div className="opacity-95">
                        <SortableFaqItem
                          faq={orderedFaqs.find((f) => f.id === activeFaqId)!}
                          isDragOverlay
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

      <FaqCategoryDialog open={open} setOpen={setOpen} editingRow={editingCategory ?? undefined} />

      <FaqDialog
        open={openFaqDialog}
        setOpen={setOpenFaqDialog}
        editingRow={editingFaq ?? undefined}
        categoryId={selectedCategoryId ?? undefined}
        categories={rawCategories.map((c) => ({ id: c.id, name: c.name }))}
      />

      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Are you sure?"
        description="This action cannot be undone. This will permanently delete this category and all its questions."
        onConfirm={confirmDelete}
        isDeleting={isDeletingCategory}
      />

      <DeleteConfirmDialog
        open={deleteFaqConfirmOpen}
        onOpenChange={setDeleteFaqConfirmOpen}
        title="Delete question?"
        description="This action cannot be undone. This will permanently delete the question."
        onConfirm={confirmDeleteFaq}
        isDeleting={isDeletingFaq}
      />
    </>
  );
};

export default Page;
