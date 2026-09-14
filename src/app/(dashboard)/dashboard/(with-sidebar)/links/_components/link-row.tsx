"use client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LinkType } from "@/drizzle/types";
import { IconKey } from "@/lib/types/links";
import { ICON_REGISTRY } from "@/utils/links";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Copy as CopyIcon,
  Eye,
  EyeOff,
  GripVertical,
  Link as LinkIcon,
  MousePointerClick,
  Pencil,
  Trash2,
} from "lucide-react";
import { memo } from "react";

export const LinkRow = memo(
  ({
    row,
    onToggle,
    onEdit,
    onDelete,
    onCopy,
    topClicks = 0,
    isDragOverlay = false,
    isDragDisabled = false,
    isToggleDisabled = false,
    isDeleteDisabled = false,
  }: {
    row: LinkType;
    /** Clicks on the best-performing link, used to scale this row's bar. */
    topClicks?: number;
    onToggle?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onCopy?: () => void;
    isDragOverlay?: boolean;
    isDragDisabled?: boolean;
    isToggleDisabled?: boolean;
    isDeleteDisabled?: boolean;
  }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: row.id,
      disabled: isDragOverlay || isDragDisabled,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.4 : 1,
    };

    const Icon = ICON_REGISTRY[row.icon_key as IconKey]?.Icon ?? LinkIcon;
    const iconLabel = ICON_REGISTRY[row.icon_key as IconKey]?.label ?? "Link";
    const hasActions = !isDragOverlay && onToggle && onCopy && onEdit && onDelete;

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`group touch-none flex flex-col gap-2 rounded-xl border p-2.5 sm:flex-row sm:items-center sm:gap-3 sm:p-3 ${
          isDragOverlay
            ? "border-white/40 bg-surface-2 shadow-2xl"
            : "border-white/5 bg-background hover:border-white/15"
        } ${!row.active && !isDragOverlay ? "opacity-60" : ""}`}
      >
        {/* Primary: drag handle + icon + title/url */}
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          {!isDragOverlay && !isDragDisabled ? (
            <button
              {...attributes}
              {...listeners}
              className="flex h-8 w-5 shrink-0 cursor-grab items-center justify-center text-muted-foreground opacity-100 transition active:cursor-grabbing sm:h-4 sm:w-4 sm:opacity-30 sm:group-hover:opacity-100"
              aria-label="Drag link"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          ) : (
            <div className="h-8 w-5 shrink-0 sm:h-4 sm:w-4" />
          )}

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-white/20 to-emerald-500/10 sm:h-10 sm:w-10">
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="truncate text-sm font-medium">{row.title}</h4>
              <span className="hidden shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
                {iconLabel}
              </span>
            </div>
            <p className="truncate text-[11px] text-muted-foreground">{row.url}</p>
          </div>
        </div>

        {/* Secondary: clicks + actions - own row on mobile, inline from sm */}
        <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-2 pl-7 sm:justify-end sm:gap-3 sm:border-0 sm:pt-0 sm:pl-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex shrink-0 items-center gap-2">
                {/* Bar is relative to the best link, so rows are comparable
                    at a glance rather than being bare numbers. */}
                <div className="hidden h-1 w-16 overflow-hidden rounded-full bg-white/5 sm:block">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-500"
                    style={{
                      width: `${topClicks > 0 ? Math.round((row.clicks / topClicks) * 100) : 0}%`,
                    }}
                  />
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MousePointerClick className="h-3 w-3" />
                  <span className="tabular-nums">{row.clicks.toLocaleString()}</span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>
                {row.clicks.toLocaleString()} click{row.clicks === 1 ? "" : "s"} from your public
                page
              </p>
            </TooltipContent>
          </Tooltip>

          {hasActions && (
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onToggle}
                    disabled={isToggleDisabled}
                    className="rounded-md p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed sm:p-1.5"
                    aria-label={row.active ? "Hide" : "Show"}
                  >
                    {row.active ? (
                      <Eye className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                    ) : (
                      <EyeOff className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{row.active ? "Hide link" : "Show link"}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onCopy}
                    className="rounded-md p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground sm:p-1.5"
                    aria-label="Copy URL"
                  >
                    <CopyIcon className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Copy URL</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onEdit}
                    className="rounded-md p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground sm:p-1.5"
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Edit link</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onDelete}
                    disabled={isDeleteDisabled}
                    className="rounded-md p-2 text-muted-foreground hover:bg-danger/10 hover:text-danger disabled:opacity-50 disabled:cursor-not-allowed sm:p-1.5"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Delete link</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    );
  },
);

LinkRow.displayName = "Row";
