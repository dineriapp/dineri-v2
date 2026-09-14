"use client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ReactElement, ReactNode } from "react";

/**
 * Wraps a single control in a tooltip.
 *
 * `disabled` skips the tooltip entirely - used for dnd-kit drag overlays so a
 * tooltip can't portal itself while a card is being dragged.
 *
 * Note: a natively `disabled` button swallows pointer events, so its tooltip
 * will never open. Wrap such a button in a plain element (and give the button
 * `pointer-events-none`) so the wrapper receives the hover instead.
 */
export const Tip = ({
  label,
  disabled,
  side,
  contentClassName,
  children,
}: {
  label: ReactNode;
  disabled?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  contentClassName?: string;
  children: ReactElement;
}) =>
  disabled ? (
    children
  ) : (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className={contentClassName}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
