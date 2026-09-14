import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

type MenuUIState = {
    view: "grid" | "list"; // not a record
};
export const useMenuUIStore = create<MenuUIState>()(
    persist(
        immer(() => ({
            view: "grid",
        })),
        {
            name: "menu-ui-storage",
        }
    )
);

export function setMenuView(view: "grid" | "list") {
    useMenuUIStore.setState((state) => {
        state.view = view;
    });
}