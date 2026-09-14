import { TimelineRange } from "@/app/(dashboard)/dashboard/(with-sidebar)/orders/actions";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

type OrdersUIState = {
    view: "table" | "board";
    timeline: TimelineRange;
    autoRefresh: "off" | "30s" | "1m" | "2m" | "5m";
};

export const useOrdersUIStore = create<OrdersUIState>()(
    persist(
        immer(() => ({
            view: "table",
            timeline: "today",
            autoRefresh: "2m",
        })),
        {
            name: "orders-ui-persisted",
        }
    )
);


export function setOrdersView(view: "table" | "board") {
    useOrdersUIStore.setState((state) => {
        state.view = view;
    });
}

export function setOrdersTimeline(timeline: TimelineRange) {
    useOrdersUIStore.setState((state) => {
        state.timeline = timeline;
    });
}

export function setOrdersAutoRefresh(
    interval: "off" | "30s" | "1m" | "2m" | "5m"
) {
    useOrdersUIStore.setState((state) => {
        state.autoRefresh = interval;
    });
}
