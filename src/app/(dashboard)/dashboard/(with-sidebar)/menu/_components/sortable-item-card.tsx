"use client";
import { MenuItemType } from "@/drizzle/types";
import { StripeCurrency } from "@/lib/stripe/types";
import { formatPrice } from "@/lib/utils";
import { TAG_ICONS } from "@/utils/tag-icons";
import { resolveTags, TagGroup } from "@/utils/tags";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical, Pencil, Star, Trash2 } from "lucide-react";
import { Tip } from "@/components/ui/tip";

const TAG_TONE: Record<TagGroup, string> = {
  highlight: "border-danger/25 bg-danger/10 text-danger",
  diet: "border-success/25 bg-success/10 text-success",
  allergen: "border-warning/30 bg-warning/10 text-warning",
};

export const SortableMenuItemCard = ({
  item,
  view,
  currency,
  onEdit,
  onDelete,
  onToggle,
}: {
  item: MenuItemType;
  view: "grid" | "list";
  currency: StripeCurrency;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const gridTags = resolveTags(item.tags).filter((t) => t.key !== "featured");

  // Reuse the visual part – we duplicate the existing markup but attach drag handles.
  if (view === "list") {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`group touch-none flex items-center gap-2 rounded-xl border border-white/5 bg-background p-2.5 transition hover:border-white/15 sm:gap-3 sm:p-3 ${
          !item.show_on_public_page ? "opacity-60!" : "opacity-100!"
        }`}
      >
        {/* Primary: drag handle + image + name/description */}
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          {/* Drag handle */}
          <Tip label="Drag to reorder">
            <button
              {...attributes}
              {...listeners}
              className="flex h-8 w-5 shrink-0 cursor-grab items-center justify-center text-muted-foreground opacity-100 transition active:cursor-grabbing sm:h-4 sm:w-4 sm:opacity-30 sm:group-hover:opacity-100"
              aria-label="Drag item"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          </Tip>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-linear-to-br from-white/20 to-emerald-500/10 text-2xl sm:h-12 sm:w-12">
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image.url ?? ""} alt="" className="h-full w-full object-cover" />
            ) : (
              "📋"
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Tip
                contentClassName="flex-col items-start gap-0.5"
                label={
                  <>
                    <span className="font-medium">{item.name}</span>
                    {item.description && <span className="opacity-70">{item.description}</span>}
                  </>
                }
              >
                <h4 className="truncate text-sm font-medium">{item.name}</h4>
              </Tip>
              {resolveTags(item.tags).map((tag) => {
                const Icon = TAG_ICONS[tag.key];
                return (
                  <Tip key={tag.key} label={tag.publicLabel}>
                    <span className="shrink-0">
                      <Icon className="h-3 w-3 text-muted-foreground" />
                    </span>
                  </Tip>
                );
              })}
            </div>
            <p className="truncate text-[11px] text-muted-foreground">{item.description}</p>
          </div>
        </div>

        {/* Right: price above the icons on mobile; inline from sm */}
        <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
          <div className="shrink-0 text-sm font-semibold tabular-nums text-white">
            {formatPrice(item.price, currency)}
          </div>
          <ItemActions item={item} onEdit={onEdit} onToggle={onToggle} onDelete={onDelete} />
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group touch-none relative overflow-hidden rounded-2xl border border-white/5 bg-background transition hover:border-white/15 ${
        !item.show_on_public_page ? "opacity-60!" : "opacity-100!"
      }`}
    >
      {/* Drag handle */}
      <Tip label="Drag to reorder" side="right">
        <button
          {...attributes}
          {...listeners}
          className="absolute left-2 top-2 z-10 rounded-md bg-background/80 p-1.5 text-muted-foreground opacity-100 backdrop-blur transition cursor-grab active:cursor-grabbing sm:p-1 sm:opacity-0 sm:group-hover:opacity-100"
          aria-label="Drag item"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      </Tip>

      {/* Image */}
      <div className="relative flex aspect-square! items-center justify-center overflow-hidden bg-linear-to-br from-white/15 via-emerald-500/5 to-transparent text-5xl">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image.url ?? ""} alt="" className="h-full w-full object-cover" />
        ) : (
          <span>&quot;📋&quot;</span>
        )}
        {item.tags?.includes("featured") && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-semibold text-warning backdrop-blur">
            <Star className="h-2.5 w-2.5 fill-current" /> Featured
          </span>
        )}
        {!item.show_on_public_page && (
          <span className="absolute left-2 bottom-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] text-muted-foreground backdrop-blur">
            Hidden
          </span>
        )}
        {item.addons && item.addons.length > 0 && (
          <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-[10px] text-muted-foreground backdrop-blur">
            +{item.addons.length} add-on{item.addons.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold leading-tight">{item.name}</h4>
          <span className="shrink-0 text-sm font-bold tabular-nums text-white">
            {formatPrice(item.price, currency)}
          </span>
        </div>
        {item.description ? (
          <Tip label={item.description}>
            <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
              {item.description}
            </p>
          </Tip>
        ) : (
          <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{item.description}</p>
        )}

        {gridTags.length > 0 && (
          <ul className="mt-2 flex flex-wrap items-center gap-1">
            {gridTags.map((tag) => {
              const Icon = TAG_ICONS[tag.key];
              return (
                <li
                  key={tag.key}
                  className={`inline-flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[10px] ${TAG_TONE[tag.group]}`}
                >
                  <Icon className="h-2.5 w-2.5 shrink-0" aria-hidden />
                  {tag.label}
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-3 flex items-center justify-end">
          <ItemActions item={item} onEdit={onEdit} onToggle={onToggle} onDelete={onDelete} />
        </div>
      </div>
    </div>
  );
};

const ItemActions = ({
  item,
  onEdit,
  onToggle,
  onDelete,
}: {
  item: MenuItemType;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) => (
  <div className="flex shrink-0 items-center gap-0.5">
    <Tip label={item.show_on_public_page ? "Hide from public page" : "Show on public page"}>
      <button
        onClick={onToggle}
        className="rounded-md p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground sm:p-1.5"
        aria-label={item.show_on_public_page ? "Hide" : "Show"}
      >
        {item.show_on_public_page ? (
          <Eye className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
        ) : (
          <EyeOff className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
        )}
      </button>
    </Tip>
    <Tip label="Edit item">
      <button
        onClick={onEdit}
        className="rounded-md p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground sm:p-1.5"
        aria-label="Edit"
      >
        <Pencil className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
      </button>
    </Tip>
    <Tip label="Delete item">
      <button
        onClick={onDelete}
        className="rounded-md p-2 text-muted-foreground hover:bg-danger/10 hover:text-danger sm:p-1.5"
        aria-label="Delete"
      >
        <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
      </button>
    </Tip>
  </div>
);
