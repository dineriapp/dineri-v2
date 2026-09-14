import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

/**
 * Marks a booking the guest paid an extra priority fee to have prioritised. Used
 * everywhere a reservation is listed so staff can spot one at a glance.
 */
export const PriorityBadge = ({ className }: { className?: string }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white",
      className,
    )}
    title="Priority reservation - extra fee paid, seated ahead of the queue"
  >
    <Star className="h-2.5 w-2.5 fill-current" /> Priority
  </span>
);
