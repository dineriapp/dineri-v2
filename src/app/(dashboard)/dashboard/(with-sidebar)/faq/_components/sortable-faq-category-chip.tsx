"use client";
import { Tip } from "@/components/ui/tip";
import { FaqCategoryWithItems } from "@/drizzle/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical, ListChecks, Pencil, Trash2 } from "lucide-react";

interface SortableFaqCategoryChipProps {
  category: FaqCategoryWithItems;
  selectedCategoryId: string | null;
  isDragOverlay?: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}

export const SortableFaqCategoryChip = ({
  category,
  selectedCategoryId,
  isDragOverlay = false,
  onSelect,
  onEdit,
  onDelete,
  onToggle,
}: SortableFaqCategoryChipProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
    disabled: isDragOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const active = category.id === selectedCategoryId;
  const show = category.active;
  const itemCount = category.items.length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group touch-none inline-flex max-w-full items-center gap-1.5 rounded-xl border px-2.5 py-1.5 sm:gap-2 sm:px-3 sm:py-2 ${
        isDragOverlay
          ? "border-white/40 bg-surface-2 shadow-2xl"
          : active
            ? "border-white/40 bg-white/10"
            : "border-white/10 bg-background hover:border-white/20"
      } ${!show && !active ? "opacity-60" : ""}`}
      onClick={onSelect}
    >
      {/* Drag Handle */}
      {!isDragOverlay && (
        <Tip label="Drag to reorder">
          <button
            {...attributes}
            {...listeners}
            className="flex shrink-0 cursor-grab items-center justify-center p-1 text-muted-foreground opacity-70 transition hover:opacity-100 active:cursor-grabbing sm:p-0 sm:opacity-40"
            aria-label="Drag category"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        </Tip>
      )}

      {/* Icon */}
      <ListChecks className="h-3.5 w-3.5 shrink-0 text-white" />

      {/* Name & count - tooltip shows the full name when truncated */}
      <Tip
        disabled={isDragOverlay}
        contentClassName="flex-col items-start gap-0.5"
        label={
          <>
            <span className="font-medium">{category.name}</span>
            <span className="opacity-70">
              {itemCount} {itemCount === 1 ? "question" : "questions"} ·{" "}
              {show ? "Visible on public page" : "Hidden from public page"}
            </span>
          </>
        }
      >
        <span className="truncate text-xs font-medium">{category.name}</span>
      </Tip>
      <span
        className={`shrink-0 rounded-full px-1.5 text-[10px] tabular-nums ${
          active ? "bg-white/20" : "bg-white/5 text-muted-foreground"
        }`}
      >
        {itemCount}
      </span>

      {/* Clickable visibility toggle */}
      <Tip disabled={isDragOverlay} label={show ? "Hide from public page" : "Show on public page"}>
        <button
          onClick={(e) => {
            e.stopPropagation(); // prevent category selection
            onToggle();
          }}
          className="shrink-0 rounded p-1.5 transition hover:bg-white/10 sm:p-0.5"
          aria-label={show ? "Hide category" : "Show category"}
        >
          {show ? (
            <Eye className="h-3.5 w-3.5 text-white" />
          ) : (
            <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
      </Tip>

      {/* Action buttons */}
      {!isDragOverlay && (
        <>
          <Tip label="Edit category">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="shrink-0 rounded p-1.5 text-muted-foreground transition hover:text-foreground sm:p-0"
              aria-label="Edit"
            >
              <Pencil className="h-3 w-3" />
            </button>
          </Tip>
          <Tip label="Delete category">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="shrink-0 rounded p-1.5 text-muted-foreground transition hover:text-danger sm:p-0"
              aria-label="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </Tip>
        </>
      )}
    </div>
  );
};
