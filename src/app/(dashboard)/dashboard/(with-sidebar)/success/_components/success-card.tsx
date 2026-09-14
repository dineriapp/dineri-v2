"use client";
import { Tip } from "@/components/ui/tip";
import { SuccessStoryType } from "@/drizzle/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical, Image as ImageIcon, Pencil, Quote, Trash2 } from "lucide-react";

export const SuccessStoryCard = ({
  s,
  onEdit,
  onDelete,
  onToggle,
  isDragOverlay = false,
}: {
  s: SuccessStoryType;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  isDragOverlay?: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: s.id,
    disabled: isDragOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={` group relative overflow-hidden  rounded-2xl border border-white/5 bg-surface-1  hover:border-white/15 ${
        !s.active ? "opacity-60!" : ""
      } ${isDragOverlay ? "border-white/40 shadow-2xl" : ""}`}
    >
      {/* Drag handle */}
      {!isDragOverlay && (
        <Tip label="Drag to reorder" side="right">
          <button
            {...attributes}
            {...listeners}
            className="absolute left-2 top-2 z-10 rounded-md bg-background/80 p-1.5 text-muted-foreground opacity-100 backdrop-blur transition cursor-grab active:cursor-grabbing sm:p-1 sm:opacity-0 sm:group-hover:opacity-100"
            aria-label="Drag story"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        </Tip>
      )}

      <div className="relative aspect-video! overflow-hidden bg-linear-to-br from-white/15 via-emerald-500/5 to-transparent">
        {s.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.image.url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-8 w-8 opacity-40" />
          </div>
        )}
        {!s.active && (
          <Tip label="Not shown on your public page">
            <span className="absolute right-3 top-3 rounded-full bg-background/80 px-2 py-0.5 text-[10px] text-muted-foreground backdrop-blur">
              Hidden
            </span>
          </Tip>
        )}
      </div>
      <div className="p-3 sm:p-4 flex flex-col justify-between">
        <div className="flex items-start gap-2">
          <Quote className="mt-0.5 h-4 w-4 shrink-0 text-white" />
          <h3 className="font-inter-tight text-base font-semibold leading-snug">{s.title}</h3>
        </div>
        {s.body ? (
          <Tip label={s.body} contentClassName="max-w-sm">
            <p className="mt-2 line-clamp-1 text-[13px] leading-relaxed text-muted-foreground">
              {s.body}
            </p>
          </Tip>
        ) : (
          <p className="mt-2 line-clamp-1 text-[13px] leading-relaxed text-muted-foreground">
            {s.body}
          </p>
        )}
        <div className="mt-4 flex items-center justify-end gap-0.5 border-t border-white/5 pt-3">
          <Tip label={s.active ? "Hide from public page" : "Show on public page"}>
            <button
              onClick={onToggle}
              className="rounded-md p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground sm:p-1.5"
              aria-label={s.active ? "Hide story" : "Show story"}
            >
              {s.active ? (
                <Eye className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              ) : (
                <EyeOff className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              )}
            </button>
          </Tip>
          <Tip label="Edit story">
            <button
              onClick={onEdit}
              className="rounded-md p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground sm:p-1.5"
              aria-label="Edit story"
            >
              <Pencil className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </button>
          </Tip>
          <Tip label="Delete story">
            <button
              onClick={onDelete}
              className="rounded-md p-2 text-muted-foreground hover:bg-danger/10 hover:text-danger sm:p-1.5"
              aria-label="Delete story"
            >
              <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </button>
          </Tip>
        </div>
      </div>
    </article>
  );
};
