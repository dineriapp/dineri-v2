import type { ActivityGroup } from "@/lib/activity/definitions";
import {
    CalendarCheck,
    Image as ImageIcon,
    Plug,
    Settings2,
    ShoppingBag,
    UtensilsCrossed,
} from "lucide-react";

/**
 * How each activity group looks wherever the feed is rendered — the merchant
 * dashboard panel and the admin tables share this so a "menu" row reads the
 * same in both.
 */
export const ACTIVITY_GROUP_STYLE: Record<
    ActivityGroup,
    { label: string; icon: React.ElementType; className: string }
> = {
    order: {
        label: "Orders",
        icon: ShoppingBag,
        className: "border-lime/25 bg-lime/10 text-lime",
    },
    reservation: {
        label: "Reservations",
        icon: CalendarCheck,
        className: "border-info/25 bg-info/10 text-info",
    },
    menu: {
        label: "Menu",
        icon: UtensilsCrossed,
        className: "border-warning/25 bg-warning/10 text-warning",
    },
    content: {
        label: "Content",
        icon: ImageIcon,
        className: "border-white/10 bg-white/5 text-foreground",
    },
    settings: {
        label: "Settings",
        icon: Settings2,
        className: "border-white/10 bg-white/5 text-muted-foreground",
    },
    integration: {
        label: "Integrations",
        icon: Plug,
        className: "border-white/10 bg-white/5 text-muted-foreground",
    },
};
