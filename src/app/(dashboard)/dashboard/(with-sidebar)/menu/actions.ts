"use server";

import { db } from "@/drizzle/db";
import { menuCategories, menuItems, restaurant } from "@/drizzle/schema";
import { MenuCategoryWithItems } from "@/drizzle/types"; // adjust import path
import { logMerchantActivity } from "@/lib/activity/log";
import { ensureAuthenticatedUser, ensureAuthenticatedUserLean } from "@/lib/auth/guards";
import { checkResourceLimit, checkResourceLimitWithCount } from "@/lib/stripe/resource-guard";
import { ApiResponse } from "@/lib/types";
import { menuCategorySchema, MenuCategorySchemaType, menuItemSchema, MenuItemSchemaType } from "@/lib/validators/zod/menu-scheam";
import { and, asc, eq, sql } from "drizzle-orm";

export async function getMenuCategoryWithItems(): Promise<ApiResponse<MenuCategoryWithItems[]>> {
    try {
        const auth = await ensureAuthenticatedUserLean();
        if (!auth.session) {
            return auth.json;
        }

        const { activeRestaurantId } = auth.session.user;

        const categories = await db.query.menuCategories.findMany({
            where: eq(menuCategories.restaurantId, activeRestaurantId),
            orderBy: [asc(menuCategories.sort_order)],
            with: {
                items: {
                    orderBy: [asc(menuItems.sort_order)],
                },
            },
        });

        return {
            success: true,
            data: categories,
        };
    } catch (error) {
        console.error("Failed to fetch menu with categories:", error);
        return {
            success: false,
            error: "Failed to fetch menu",
        };
    }
}

// Create category
export async function createMenuCategory(
    input: MenuCategorySchemaType
): Promise<ApiResponse<{ id: string }>> {
    try {
        const parsed = menuCategorySchema.safeParse(input);
        if (!parsed.success) {
            return {
                success: false,
                error: parsed.error.issues[0]?.message ?? "Invalid input",
            };
        }

        const auth = await ensureAuthenticatedUser();
        if (!auth.session) {
            return auth.json;
        }

        const { activeRestaurantId, subscription: { plan } } = auth.session.user;

        const limitCheck = await checkResourceLimit(
            plan,
            'menu',
            activeRestaurantId,
            menuCategories
        );
        if (!limitCheck.allowed) {
            return { success: false, error: limitCheck.error };
        }

        // Get last sort_order for this restaurant
        const lastCategory = await db.query.menuCategories.findFirst({
            where: eq(menuCategories.restaurantId, activeRestaurantId),
            orderBy: (categories, { desc }) => [desc(categories.sort_order)],
        });

        const sort_order = (lastCategory?.sort_order ?? -1) + 1;

        const [category] = await db
            .insert(menuCategories)
            .values({
                restaurantId: activeRestaurantId,
                name: parsed.data.name,
                show_on_public_page: parsed.data.show_on_public_page,
                sort_order,
            })
            .returning({ id: menuCategories.id });
        logMerchantActivity(auth.session.user, {
            type: "menu.category.created",
            entityId: category.id,
            data: { name: parsed.data.name },
        });

        return {
            success: true,
            data: { id: category.id },
        };
    } catch (error) {
        console.error("Failed to create category:", error);
        return {
            success: false,
            error: "Failed to create category",
        };
    }
}
// Update menu category
export async function updateMenuCategory(
    id: string,
    input: MenuCategorySchemaType
): Promise<ApiResponse<{ id: string }>> {
    try {
        const parsed = menuCategorySchema.safeParse(input);
        if (!parsed.success) {
            return {
                success: false,
                error: parsed.error.issues[0]?.message ?? "Invalid input",
            };
        }

        const auth = await ensureAuthenticatedUserLean();
        if (!auth.session) {
            return auth.json;
        }

        const { activeRestaurantId } = auth.session.user;

        // Verify the category belongs to this restaurant
        const existingCategory = await db.query.menuCategories.findFirst({
            where: and(
                eq(menuCategories.id, id),
                eq(menuCategories.restaurantId, activeRestaurantId)
            ),
            columns: {
                id: true
            }
        });
        if (!existingCategory) {
            return {
                success: false,
                error: "Category not found or access denied",
            };
        }

        await db
            .update(menuCategories)
            .set({
                name: parsed.data.name,
                show_on_public_page: parsed.data.show_on_public_page,
                sort_order: parsed.data.sort_order,
            })
            .where(eq(menuCategories.id, id));
        logMerchantActivity(auth.session.user, {
            type: "menu.category.updated",
            entityId: id,
            data: { name: parsed.data.name },
        });

        return {
            success: true,
            data: { id },
        };
    } catch (error) {
        console.error("Failed to update category:", error);
        return {
            success: false,
            error: "Failed to update category",
        };
    }
}
// Delete menu category
export async function deleteMenuCategory(
    id: string
): Promise<ApiResponse<{ id: string }>> {
    try {
        const auth = await ensureAuthenticatedUserLean();
        if (!auth.session) {
            return auth.json;
        }

        const { activeRestaurantId } = auth.session.user;

        const existingCategory = await db.query.menuCategories.findFirst({
            where: and(
                eq(menuCategories.id, id),
                eq(menuCategories.restaurantId, activeRestaurantId)
            ),
        });
        if (!existingCategory) {
            return {
                success: false,
                error: "Category not found or access denied",
            };
        }

        await db
            .delete(menuCategories)
            .where(
                and(
                    eq(menuCategories.id, id),
                    eq(menuCategories.restaurantId, activeRestaurantId)
                )
            );
        logMerchantActivity(auth.session.user, {
            type: "menu.category.deleted",
            entityId: id,
            data: { name: existingCategory.name },
        });

        return {
            success: true,
            data: { id },
        };
    } catch (error) {
        console.error("Failed to delete category:", error);
        return {
            success: false,
            error: "Failed to delete category",
        };
    }
}
// Reorder menu categories
export async function reorderMenuCategories(
    categories: { id: string; sort_order: number }[]
): Promise<ApiResponse<null>> {
    try {
        const auth = await ensureAuthenticatedUserLean();
        if (!auth.session) {
            return auth.json;
        }

        const { activeRestaurantId } = auth.session.user;

        await db.transaction(async (tx) => {
            for (const cat of categories) {
                await tx
                    .update(menuCategories)
                    .set({ sort_order: cat.sort_order })
                    .where(
                        and(
                            eq(menuCategories.id, cat.id),
                            eq(menuCategories.restaurantId, activeRestaurantId)
                        )
                    );
            }
        });

        return { success: true, data: null };
    } catch (error) {
        console.error("Failed to reorder categories:", error);
        return { success: false, error: "Failed to reorder categories" };
    }
}
export async function toggleCategoryVisibility(
    id: string,
    show: boolean
): Promise<ApiResponse<{ id: string; show_on_public_page: boolean }>> {
    try {
        const auth = await ensureAuthenticatedUserLean();
        if (!auth.session) return auth.json;
        const { activeRestaurantId } = auth.session.user;

        const category = await db.query.menuCategories.findFirst({
            where: and(eq(menuCategories.id, id), eq(menuCategories.restaurantId, activeRestaurantId)),
            columns: {
                id: true,
                name: true,
            }
        });
        if (!category) {
            return { success: false, error: "Category not found or access denied" };
        }

        await db
            .update(menuCategories)
            .set({ show_on_public_page: show })
            .where(eq(menuCategories.id, id));
        logMerchantActivity(auth.session.user, {
            type: "menu.category.updated",
            entityId: id,
            data: { name: `${category.name} · ${show ? "shown" : "hidden"}` },
        });

        return { success: true, data: { id, show_on_public_page: show } };
    } catch (error) {
        console.error("Failed to toggle category visibility:", error);
        return { success: false, error: "Failed to update category visibility" };
    }
}

export async function createMenuItem(
    input: MenuItemSchemaType
): Promise<ApiResponse<{ id: string }>> {
    try {
        const parsed = menuItemSchema.safeParse(input);
        if (!parsed.success) {
            return {
                success: false,
                error: parsed.error.issues[0]?.message ?? "Invalid input",
            };
        }

        const auth = await ensureAuthenticatedUser();
        if (!auth.session) {
            return auth.json;
        }

        const { activeRestaurantId, subscription: { plan } } = auth.session.user;

        // Verify the category belongs to this restaurant
        const category = await db.query.menuCategories.findFirst({
            where: and(
                eq(menuCategories.id, parsed.data.categoryId),
                eq(menuCategories.restaurantId, activeRestaurantId)
            ),
            columns: {
                id: true
            }
        });
        if (!category) {
            return {
                success: false,
                error: "Category not found or does not belong to your restaurant",
            };
        }

        const [result] = await db
            .select({ count: sql<number>`count(*)` })
            .from(menuItems)
            .where(eq(menuItems.categoryId, category.id));

        const limitCheck = await checkResourceLimitWithCount(
            plan,
            'items_per_category',
            result.count ?? 0
        );
        if (!limitCheck.allowed) {
            return { success: false, error: limitCheck.error };
        }

        // Get last sort_order for this category
        const lastItem = await db.query.menuItems.findFirst({
            where: eq(menuItems.categoryId, parsed.data.categoryId),
            orderBy: (items, { desc }) => [desc(items.sort_order)],
            columns: {
                sort_order: true
            }
        });

        const sort_order = (lastItem?.sort_order ?? -1) + 1;

        // Take the first image (array with one item) – convert to single object
        const image = parsed.data.image?.[0] ?? null;

        const [newItem] = await db
            .insert(menuItems)
            .values({
                categoryId: parsed.data.categoryId,
                image,
                name: parsed.data.name,
                emoji: parsed.data.emoji,
                price: parsed.data.price.toString(),
                description: parsed.data.description ?? null,
                customization_detail: parsed.data.customization_detail ?? null,
                sort_order,
                addons: parsed.data.addons,
                tags: parsed.data.tags,
                show_on_public_page: parsed.data.show_on_public_page,
            })
            .returning({ id: menuItems.id });
        logMerchantActivity(auth.session.user, {
            type: "menu.item.created",
            entityId: newItem.id,
            data: { name: parsed.data.name },
        });

        return {
            success: true,
            data: { id: newItem.id },
        };
    } catch (error) {
        console.error("Failed to create menu item:", error);
        return {
            success: false,
            error: "Failed to create menu item",
        };
    }
}

export async function updateMenuItem(
    id: string,
    input: MenuItemSchemaType
): Promise<ApiResponse<{ id: string }>> {
    try {
        const parsed = menuItemSchema.safeParse(input);
        if (!parsed.success) {
            return {
                success: false,
                error: parsed.error.issues[0]?.message ?? "Invalid input",
            };
        }

        const auth = await ensureAuthenticatedUserLean();
        if (!auth.session) {
            return auth.json;
        }
        const { activeRestaurantId } = auth.session.user;

        // Verify the item belongs to a category owned by this restaurant
        const existingItem = await db.query.menuItems.findFirst({
            where: eq(menuItems.id, id),
            with: {
                category: {
                    columns: {
                        restaurantId: true
                    }
                }
            },
            columns: {
                id: true
            }
        });
        if (!existingItem || existingItem.category.restaurantId !== activeRestaurantId) {
            return {
                success: false,
                error: "Menu item not found or access denied",
            };
        }

        // Ensure the new category also belongs to the same restaurant
        const newCategory = await db.query.menuCategories.findFirst({
            where: and(
                eq(menuCategories.id, parsed.data.categoryId),
                eq(menuCategories.restaurantId, activeRestaurantId)
            ),
            columns: {
                id: true
            }
        });
        if (!newCategory) {
            return {
                success: false,
                error: "Target category not found or does not belong to your restaurant",
            };
        }

        // Convert image array → single object
        const image = parsed.data.image?.[0] ?? null;

        await db
            .update(menuItems)
            .set({
                categoryId: parsed.data.categoryId,
                image,
                name: parsed.data.name,
                emoji: parsed.data.emoji,
                price: parsed.data.price.toString(),
                description: parsed.data.description ?? null,
                customization_detail: parsed.data.customization_detail ?? null,
                sort_order: parsed.data.sort_order,
                addons: parsed.data.addons,
                tags: parsed.data.tags,
                show_on_public_page: parsed.data.show_on_public_page,
            })
            .where(eq(menuItems.id, id));
        logMerchantActivity(auth.session.user, {
            type: "menu.item.updated",
            entityId: id,
            data: { name: parsed.data.name },
        });

        return {
            success: true,
            data: { id },
        };
    } catch (error) {
        console.error("Failed to update menu item:", error);
        return {
            success: false,
            error: "Failed to update menu item",
        };
    }
}

export async function toggleMenuItemVisibility(
    id: string,
    show: boolean
): Promise<ApiResponse<{ id: string; show_on_public_page: boolean }>> {
    try {
        const auth = await ensureAuthenticatedUserLean();
        if (!auth.session) {
            return auth.json;
        }
        const { activeRestaurantId } = auth.session.user;

        // Verify the item belongs to a category owned by this restaurant
        const existingItem = await db.query.menuItems.findFirst({
            where: eq(menuItems.id, id),
            with: {
                category: {
                    columns: {
                        restaurantId: true
                    }
                }
            },
            columns: {
                id: true,
                name: true,
            }
        });
        if (!existingItem || existingItem.category.restaurantId !== activeRestaurantId) {
            return {
                success: false,
                error: "Menu item not found or access denied",
            };
        }

        await db
            .update(menuItems)
            .set({ show_on_public_page: show })
            .where(eq(menuItems.id, id));
        logMerchantActivity(auth.session.user, {
            type: "menu.item.updated",
            entityId: id,
            data: { name: `${existingItem.name} · ${show ? "shown" : "hidden"}` },
        });

        return {
            success: true,
            data: { id, show_on_public_page: show },
        };
    } catch (error) {
        console.error("Failed to toggle menu item visibility:", error);
        return {
            success: false,
            error: "Failed to update visibility",
        };
    }
}

export async function deleteMenuItem(
    id: string
): Promise<ApiResponse<{ id: string }>> {
    try {
        const auth = await ensureAuthenticatedUserLean();
        if (!auth.session) {
            return auth.json;
        }
        const { activeRestaurantId } = auth.session.user;

        // Verify the item belongs to a category owned by this restaurant
        const existingItem = await db.query.menuItems.findFirst({
            where: eq(menuItems.id, id),
            with: {
                category: {
                    columns: {
                        restaurantId: true
                    }
                }
            },
            columns: {
                id: true,
                name: true,
            }
        });
        if (!existingItem || existingItem.category.restaurantId !== activeRestaurantId) {
            return {
                success: false,
                error: "Menu item not found or access denied",
            };
        }

        await db
            .delete(menuItems)
            .where(eq(menuItems.id, id));
        logMerchantActivity(auth.session.user, {
            type: "menu.item.deleted",
            entityId: id,
            data: { name: existingItem.name },
        });

        return {
            success: true,
            data: { id },
        };
    } catch (error) {
        console.error("Failed to delete menu item:", error);
        return {
            success: false,
            error: "Failed to delete menu item",
        };
    }
}

export async function reorderMenuItems(
    items: { id: string; sort_order: number }[]
): Promise<ApiResponse<null>> {
    try {
        const auth = await ensureAuthenticatedUserLean();
        if (!auth.session) return auth.json;
        const { activeRestaurantId } = auth.session.user;

        // Verify all items belong to the user's restaurant
        for (const item of items) {
            const existing = await db.query.menuItems.findFirst({
                where: eq(menuItems.id, item.id),
                with: {
                    category: {
                        columns: { restaurantId: true }
                    }
                },
                columns: {
                    id: true
                }
            });
            if (!existing || existing.category.restaurantId !== activeRestaurantId) {
                return { success: false, error: "Access denied for one or more items" };
            }
        }

        await db.transaction(async (tx) => {
            for (const item of items) {
                await tx
                    .update(menuItems)
                    .set({ sort_order: item.sort_order })
                    .where(eq(menuItems.id, item.id));
            }
        });

        return { success: true, data: null };
    } catch (error) {
        console.error("Failed to reorder items:", error);
        return { success: false, error: "Failed to reorder items" };
    }
}

export async function updateRestaurantMenuStatus(
    is_menu_published: boolean
): Promise<
    ApiResponse<{ is_menu_published: boolean }>
> {
    const { session } =
        await ensureAuthenticatedUser();

    if (!session) {
        return {
            success: false,
            error: "Unauthorized",
        };
    }


    const [updatedRestaurant] =
        await db
            .update(restaurant)
            .set({
                is_menu_published: is_menu_published,
                updatedAt: new Date(),
            })
            .where(
                eq(
                    restaurant.id,
                    session.user
                        .activeRestaurantId
                )
            )
            .returning({
                is_menu_published: restaurant.is_menu_published,
            });
    logMerchantActivity(session.user, {
        type: "menu.publish_toggled",
        data: { published: is_menu_published },
    });

    return {
        success: true,
        data: updatedRestaurant,
    };
}