"use client";
import { Tip } from "@/components/ui/tip";
import { FaqType } from "@/drizzle/types";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, Eye, EyeOff, GripVertical, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
export const SortableFaqItem = ({
  faq,
  onEdit,
  onDelete,
  isFiltered = false,
  onToggle,
  isDragOverlay = false,
}: {
  faq: FaqType;
  isFiltered?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  isDragOverlay?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: faq.id,
    disabled: isDragOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group touch-none rounded-2xl border border-white/5 bg-surface-1  hover:border-white/15 ${
        !faq.active ? "opacity-60" : ""
      } ${isDragOverlay ? "border-white/40 shadow-2xl" : ""}`}
    >
      <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:gap-3 sm:p-4">
        {/* Primary: drag handle + question content */}
        <div className="flex min-w-0 flex-1 items-start gap-2 sm:gap-3">
          {/* Drag handle – only visible when not overlay */}
          {!isDragOverlay && (
            <Tip label={isFiltered ? "Clear the filters to reorder" : "Drag to reorder"}>
              <button
                {...attributes}
                {...listeners}
                className={cn(
                  "flex h-8 w-5 shrink-0 cursor-grab items-center justify-center text-muted-foreground opacity-100 transition active:cursor-grabbing sm:mt-0.5 sm:h-4 sm:w-4 sm:opacity-30 sm:group-hover:opacity-100",
                  isFiltered && "cursor-not-allowed",
                )}
                aria-label="Drag question"
              >
                <GripVertical className="h-4 w-4" />
              </button>
            </Tip>
          )}
          {isDragOverlay && <div className="h-8 w-5 shrink-0 sm:h-4 sm:w-4" />}

          {/* Content */}
          <button onClick={() => setOpen((prev) => !prev)} className="min-w-0 flex-1 text-left">
            {!faq.active && (
              <div className="flex flex-wrap items-center gap-2">
                <Tip label="Not shown on your public page">
                  <span className="rounded-md bg-warning/10 px-1.5 py-0.5 text-[10px] text-warning">
                    Hidden
                  </span>
                </Tip>
              </div>
            )}
            <h4 className={`text-sm font-semibold ${!faq.active ? "mt-1" : ""}`}>{faq.question}</h4>
            {open && (
              <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-muted-foreground">
                {faq.answer}
              </p>
            )}
          </button>
        </div>

        {/* Action buttons - own row on mobile, inline from sm */}
        <div className="flex shrink-0 items-center justify-end gap-0.5 border-t border-white/5 pt-2 pl-7 sm:border-0 sm:pt-0 sm:pl-0">
          <Tip label={open ? "Hide answer" : "Show answer"}>
            <button
              onClick={() => setOpen((prev) => !prev)}
              className="rounded-md p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground sm:p-1.5"
              aria-label="Toggle"
            >
              <ChevronDown
                className={`h-4 w-4 transition sm:h-3.5 sm:w-3.5 ${open ? "rotate-180" : ""}`}
              />
            </button>
          </Tip>
          <Tip label={faq.active ? "Hide from public page" : "Show on public page"}>
            <button
              onClick={onToggle}
              className="rounded-md p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground sm:p-1.5"
              aria-label="Visibility"
            >
              {faq.active ? (
                <Eye className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              ) : (
                <EyeOff className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              )}
            </button>
          </Tip>
          <Tip label="Edit question">
            <button
              onClick={onEdit}
              className="rounded-md p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground sm:p-1.5"
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </button>
          </Tip>
          <Tip label="Delete question">
            <button
              onClick={onDelete}
              className="rounded-md p-2 text-muted-foreground hover:bg-danger/10 hover:text-danger sm:p-1.5"
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
