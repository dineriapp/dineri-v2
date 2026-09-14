import { createMenuCategory, createMenuItem, deleteMenuCategory, deleteMenuItem, getMenuCategoryWithItems, reorderMenuCategories, reorderMenuItems, toggleCategoryVisibility, toggleMenuItemVisibility, updateMenuCategory, updateMenuItem } from "@/app/(dashboard)/dashboard/(with-sidebar)/menu/actions";
import { MenuCategoryWithItems } from "@/drizzle/types";
import { MenuCategorySchemaType, MenuItemSchemaType } from "@/lib/validators/zod/menu-scheam";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const QUERY_KEY_MENU = "restaurant-menu" as const;

export function useMenuCategoryWithItems() {
    return useQuery<MenuCategoryWithItems[]>({
        queryKey: [QUERY_KEY_MENU],
        queryFn: async () => {
            const result = await getMenuCategoryWithItems();
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
    });
}

export function useCreateMenuCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: MenuCategorySchemaType) => {
            const result = await createMenuCategory(input);
            if (!result.success) throw new Error(result.error);
            return { id: result.data.id, input };
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_MENU] });
        },
    });
}

export function useUpdateMenuCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: MenuCategorySchemaType }) => {
            const result = await updateMenuCategory(id, data);
            if (!result.success) throw new Error(result.error);
            return { id, data };
        },

        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: [QUERY_KEY_MENU] });

            const previous = queryClient.getQueryData<MenuCategoryWithItems[]>([QUERY_KEY_MENU]);

            // Optimistically update the category
            queryClient.setQueryData<MenuCategoryWithItems[]>([QUERY_KEY_MENU], (old = []) =>
                old.map((category) =>
                    category.id === id
                        ? {
                            ...category,
                            name: data.name,
                            show_on_public_page: data.show_on_public_page,
                            sort_order: data.sort_order,
                        }
                        : category
                )
            );

            return { previous };
        },

        onError: (_error, _variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData([QUERY_KEY_MENU], context.previous);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_MENU] });
        },
    });
}

export function useDeleteMenuCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const result = await deleteMenuCategory(id);
            if (!result.success) throw new Error(result.error);
            return { id };
        },

        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: [QUERY_KEY_MENU] });

            const previous = queryClient.getQueryData<MenuCategoryWithItems[]>([QUERY_KEY_MENU]);

            // Optimistically remove the category
            queryClient.setQueryData<MenuCategoryWithItems[]>([QUERY_KEY_MENU], (old = []) =>
                old.filter((category) => category.id !== id)
            );

            return { previous };
        },

        onError: (_error, _variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData([QUERY_KEY_MENU], context.previous);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_MENU] });
        },
    });
}

export function useReorderMenuCategories() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (categories: { id: string; sort_order: number }[]) => {
            const result = await reorderMenuCategories(categories);
            if (!result.success) throw new Error(result.error);
            return result.data;
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_MENU] });
        },
    });
}

export function useToggleCategoryVisibility() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, show }: { id: string; show: boolean }) => {
            const result = await toggleCategoryVisibility(id, show);
            if (!result.success) throw new Error(result.error);
            return result.data;
        },
        onMutate: async ({ id, show }) => {
            await queryClient.cancelQueries({ queryKey: [QUERY_KEY_MENU] });
            const previous = queryClient.getQueryData<MenuCategoryWithItems[]>([QUERY_KEY_MENU]);
            queryClient.setQueryData<MenuCategoryWithItems[]>([QUERY_KEY_MENU], (old = []) =>
                old.map((cat) =>
                    cat.id === id ? { ...cat, show_on_public_page: show } : cat
                )
            );
            return { previous };
        },
        onError: (_err, _variables, context) => {
            if (context?.previous) queryClient.setQueryData([QUERY_KEY_MENU], context.previous);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_MENU] });
        },
    });
}

export function useCreateMenuItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: MenuItemSchemaType) => {
            const result = await createMenuItem(input);
            if (!result.success) throw new Error(result.error);
            return { id: result.data.id, input };
        },

        onMutate: async (newItem) => {
            await queryClient.cancelQueries({ queryKey: [QUERY_KEY_MENU] });

            const previous = queryClient.getQueryData<MenuCategoryWithItems[]>([QUERY_KEY_MENU]);

            // Optimistic update
            queryClient.setQueryData<MenuCategoryWithItems[]>([QUERY_KEY_MENU], (old = []) =>
                old.map((category) =>
                    category.id === newItem.categoryId
                        ? {
                            ...category,
                            items: [
                                ...category.items,
                                {
                                    id: crypto.randomUUID(), // temporary ID
                                    categoryId: newItem.categoryId,
                                    name: newItem.name,
                                    price: newItem.price.toString(),
                                    description: newItem.description ?? null,
                                    customization_detail: newItem.customization_detail ?? null,
                                    sort_order: newItem.sort_order,
                                    addons: newItem.addons,
                                    tags: newItem.tags,
                                    show_on_public_page: newItem.show_on_public_page,
                                    image: newItem.image?.[0] ?? null,
                                    emoji: newItem.emoji ?? "",
                                    created_at: new Date(),
                                    updated_at: new Date(),
                                },
                            ].sort((a, b) => a.sort_order - b.sort_order),
                        }
                        : category
                )
            );

            return { previous };
        },

        onError: (_error, _variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData([QUERY_KEY_MENU], context.previous);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_MENU] });
        },
    });
}

export function useUpdateMenuItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: MenuItemSchemaType }) => {
            const result = await updateMenuItem(id, data);
            if (!result.success) throw new Error(result.error);
            return { id, data };
        },

        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: [QUERY_KEY_MENU] });

            const previous = queryClient.getQueryData<MenuCategoryWithItems[]>([QUERY_KEY_MENU]);

            queryClient.setQueryData<MenuCategoryWithItems[]>([QUERY_KEY_MENU], (old = []) => {
                let itemMoved = false;
                const newCategories = old.map((category) => {
                    let updatedItems = category.items.filter((item) => item.id !== id);

                    if (category.id === data.categoryId) {
                        const optimisticItem = {
                            id,
                            categoryId: data.categoryId,
                            name: data.name,
                            price: data.price.toString(),
                            description: data.description ?? null,
                            customization_detail: data.customization_detail ?? null,
                            sort_order: data.sort_order,
                            addons: data.addons,
                            tags: data.tags,
                            show_on_public_page: data.show_on_public_page,
                            image: data.image?.[0] ?? null,
                            emoji: data.emoji,
                            created_at: new Date(),
                            updated_at: new Date(),
                        };
                        updatedItems = [...updatedItems, { ...optimisticItem, emoji: optimisticItem.emoji ?? "" }];
                        itemMoved = true;
                    }
                    return { ...category, items: updatedItems.sort((a, b) => a.sort_order - b.sort_order) };
                });

                if (!itemMoved) {
                    console.warn("Update mutation: target category not found in cache");
                }
                return newCategories;
            });

            return { previous };
        },

        onError: (_error, _variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData([QUERY_KEY_MENU], context.previous);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_MENU] });
        },
    });
}

export function useToggleMenuItemVisibility() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, show }: { id: string; show: boolean }) => {
            const result = await toggleMenuItemVisibility(id, show);
            if (!result.success) throw new Error(result.error);
            return result.data;
        },

        onMutate: async ({ id, show }) => {
            await queryClient.cancelQueries({ queryKey: [QUERY_KEY_MENU] });

            const previous = queryClient.getQueryData<MenuCategoryWithItems[]>([QUERY_KEY_MENU]);

            // Optimistically update the visibility in cache
            queryClient.setQueryData<MenuCategoryWithItems[]>([QUERY_KEY_MENU], (old = []) =>
                old.map((category) => ({
                    ...category,
                    items: category.items.map((item) =>
                        item.id === id ? { ...item, show_on_public_page: show } : item
                    ),
                }))
            );

            return { previous };
        },

        onError: (_error, _variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData([QUERY_KEY_MENU], context.previous);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_MENU] });
        },
    });
}

export function useDeleteMenuItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const result = await deleteMenuItem(id);
            if (!result.success) throw new Error(result.error);
            return { id };
        },

        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: [QUERY_KEY_MENU] });

            const previous = queryClient.getQueryData<MenuCategoryWithItems[]>([QUERY_KEY_MENU]);

            // Optimistically remove the item from all categories
            queryClient.setQueryData<MenuCategoryWithItems[]>([QUERY_KEY_MENU], (old = []) =>
                old.map((category) => ({
                    ...category,
                    items: category.items.filter((item) => item.id !== id),
                }))
            );

            return { previous };
        },

        onError: (_error, _variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData([QUERY_KEY_MENU], context.previous);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_MENU] });
        },
    });
}

export function useReorderMenuItems() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (items: { id: string; sort_order: number }[]) => {
            const result = await reorderMenuItems(items);
            if (!result.success) throw new Error(result.error);
            return result.data;
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_MENU] });
        },
    });
}
