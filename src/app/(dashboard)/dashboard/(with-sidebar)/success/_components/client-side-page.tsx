"use client";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
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
} from "@dnd-kit/sortable";
import Loader from "@/components/ui/loader";
import { SuccessStoryType } from "@/drizzle/types";
import {
  useDeleteSuccessStory,
  useReorderSuccessStories,
  useSuccessStories,
  useToggleSuccessStory,
} from "@/lib/tanstack-react-query/hooks/success-stories";
import { Eye, LoaderIcon, Plus, Sparkles, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SectionHeader, StatCard } from "../../../_components";
import TopBar from "../../../_components/top-bar";
import SuccessStoryDialog from "./success-story-dialog";
import { SuccessStoryCard } from "./success-card";

const ClientSideSuccessStoryPage = () => {
  const { data: rawStories = [], isLoading } = useSuccessStories();
  const [open, setOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<SuccessStoryType | null>(null);
  const { mutate: toggleActive } = useToggleSuccessStory();
  const { mutate: deleteStory, isPending: isDeleting } = useDeleteSuccessStory();
  const reorderMutation = useReorderSuccessStories();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Reordering state
  const [orderedStories, setOrderedStories] = useState<SuccessStoryType[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Sync ordered stories with API data (sorted by sort_order)
  useEffect(() => {
    const sorted = [...rawStories].sort((a, b) => a.sort_order - b.sort_order);
    setOrderedStories(sorted);
    setHasUnsavedChanges(false);
  }, [rawStories]);

  // Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);
  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = orderedStories.findIndex((s) => s.id === active.id);
    const newIndex = orderedStories.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const newOrder = arrayMove(orderedStories, oldIndex, newIndex);
    setOrderedStories(newOrder);
    setHasUnsavedChanges(true);
  };
  const onDragCancel = () => setActiveId(null);

  const handleSaveOrder = () => {
    const payload = orderedStories.map((story, idx) => ({ id: story.id, sort_order: idx }));
    reorderMutation.mutate(payload, {
      onSuccess: () => {
        setHasUnsavedChanges(false);
        toast.success("Story order saved.");
      },
      onError: () => toast.error("Failed to save order."),
    });
  };

  const totals = {
    total: rawStories.length,
    visible: rawStories.filter((s) => s.active).length,
  };

  const handleToggle = (id: string, active: boolean) => toggleActive({ id, active });
  const openDeleteConfirm = (id: string) => {
    setPendingDeleteId(id);
    setDeleteConfirmOpen(true);
  };
  const confirmDelete = () => {
    if (pendingDeleteId) {
      deleteStory(pendingDeleteId, {
        onSuccess: () => {
          toast.success("Story deleted");
          setDeleteConfirmOpen(false);
          setPendingDeleteId(null);
        },
        onError: (err) => toast.error(err.message),
      });
    }
  };

  const activeStory = activeId ? orderedStories.find((s) => s.id === activeId) : null;

  if (isLoading) return <Loader className="min-h-75" />;

  return (
    <>
      <TopBar page="Success Stories" />
      <div className="p-4 sm:p-6">
        <div className="space-y-4 animate-fade-in sm:space-y-6">
          <SectionHeader
            iconClassName="text-white"
            icon={Trophy}
            title="Success Stories"
            description="Share customer wins and partner stories. Drag to reorder, edit, or hide them."
            actions={
              <button
                onClick={() => {
                  setEditingRow(null);
                  setOpen(true);
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-background hover:bg-white/90"
              >
                <Plus className="h-3.5 w-3.5" /> Add story
              </button>
            }
          />

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <StatCard label="Stories" value={totals.total} icon={Trophy} />
            <StatCard label="Visible" value={totals.visible} icon={Eye} tone="white" />
          </div>

          {/* Toolbar with Save order button */}
          <div className="flex justify-end">
            {hasUnsavedChanges && (
              <button
                onClick={handleSaveOrder}
                disabled={reorderMutation.isPending}
                className="inline-flex h-9 items-center gap-1 rounded-lg bg-white px-2.5 text-[11px] font-semibold text-background hover:bg-white/90 sm:h-8"
              >
                {reorderMutation.isPending && <LoaderIcon className="animate-spin size-3" />}
                Save new order
              </button>
            )}
          </div>

          {rawStories.length === 0 ? (
            <div className=" rounded-2xl border border-dashed border-white/10 bg-surface-1 px-4 py-10 text-center sm:p-12">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-background">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-inter-tight mt-4 text-base font-semibold">
                Your first success story
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a paragraph and a cover photo to start building social proof.
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
                items={orderedStories.map((s) => s.id)}
                strategy={rectSwappingStrategy}
              >
                <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {orderedStories.map((s) => (
                    <SuccessStoryCard
                      key={s.id}
                      s={s}
                      onEdit={() => {
                        setEditingRow(s);
                        setOpen(true);
                      }}
                      onDelete={() => openDeleteConfirm(s.id)}
                      onToggle={() => handleToggle(s.id, !s.active)}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay dropAnimation={null}>
                {activeStory ? (
                  <div className="opacity-95">
                    <SuccessStoryCard
                      s={activeStory}
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
        </div>
      </div>
      <SuccessStoryDialog open={open} setOpen={setOpen} editingRow={editingRow ?? undefined} />
      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete story?"
        description="This action cannot be undone. This will permanently delete the success story."
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default ClientSideSuccessStoryPage;
