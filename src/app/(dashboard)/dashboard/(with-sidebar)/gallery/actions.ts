"use server";

import { db } from "@/drizzle/db";
import { restaurantGallery } from "@/drizzle/schema";
import { GalleryType } from "@/drizzle/types";
import { logMerchantActivity } from "@/lib/activity/log";
import { ensureAuthenticatedUser, ensureAuthenticatedUserLean } from "@/lib/auth/guards";
import { checkResourceLimit } from "@/lib/stripe/resource-guard";
import { ApiResponse } from "@/lib/types";
import { gallerySchema, GallerySchemaType, getYoutubeId } from "@/lib/validators/zod/gallery.schema";
import { and, asc, desc, eq } from "drizzle-orm";

export async function getRestaurantGalleryItems(): Promise<ApiResponse<GalleryType[]>> {
    try {
        const auth = await ensureAuthenticatedUserLean();
        if (!auth.session) {
            return auth.json;
        }

        const { activeRestaurantId } = auth.session.user;

        const items = await db.query.restaurantGallery.findMany({
            where: eq(restaurantGallery.restaurantId, activeRestaurantId),
            orderBy: [asc(restaurantGallery.sort_order)],
        });

        return {
            success: true,
            data: items,
        };
    } catch (error) {
        console.error("Failed to fetch gallery items:", error);
        return {
            success: false,
            error: "Failed to fetch gallery",
        };
    }
}

export async function createGalleryItem(
    input: GallerySchemaType
): Promise<ApiResponse<{ id: string }>> {
    try {
        const parsed = gallerySchema.safeParse(input);
        if (!parsed.success) {
            return {
                success: false,
                error: parsed.error.issues[0]?.message ?? "Invalid input",
            };
        }

        const auth = await ensureAuthenticatedUser();
        if (!auth.session) return auth.json;

        const { activeRestaurantId, subscription: { plan } } = auth.session.user;

        const limitCheck = await checkResourceLimit(
            plan,
            'gallery',
            activeRestaurantId,
            restaurantGallery
        );
        if (!limitCheck.allowed) {
            return { success: false, error: limitCheck.error };
        }

        // Get last sort_order for this restaurant
        const lastItem = await db.query.restaurantGallery.findFirst({
            where: eq(restaurantGallery.restaurantId, activeRestaurantId),
            orderBy: [desc(restaurantGallery.sort_order)],
            columns: { sort_order: true },
        });
        const sort_order = (lastItem?.sort_order ?? -1) + 1;

        // Convert image array -> single object 
        const image = parsed.data.image?.[0] ?? null;

        const youtubeId = getYoutubeId(parsed.data.youtube_url ?? "")

        const thumbnail = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
        const youtubeEmbedUrl = `https://www.youtube.com/embed/${youtubeId}`

        const [newItem] = await db
            .insert(restaurantGallery)
            .values({
                restaurantId: activeRestaurantId,
                type: parsed.data.type,
                image,
                youtube_url: parsed.data.type === "video" ? youtubeEmbedUrl : null,
                youtube_poster: parsed.data.type === "video" ? thumbnail : null,
                link_url: parsed.data.link_url ?? null,
                title: parsed.data.title ?? null,
                active: parsed.data.active,
                sort_order,
            })
            .returning({ id: restaurantGallery.id });
        logMerchantActivity(auth.session.user, {
            type: "gallery.created",
            entityId: newItem.id,
            data: { name: parsed.data.title ?? "Untitled" },
        });

        return { success: true, data: { id: newItem.id } };
    } catch (error) {
        console.error("Failed to create gallery item:", error);
        return { success: false, error: "Failed to create gallery item" };
    }
}

// Update an existing gallery item
export async function updateGalleryItem(
    id: string,
    input: GallerySchemaType
): Promise<ApiResponse<{ id: string }>> {
    try {
        const parsed = gallerySchema.safeParse(input);
        if (!parsed.success) {
            return {
                success: false,
                error: parsed.error.issues[0]?.message ?? "Invalid input",
            };
        }

        const auth = await ensureAuthenticatedUserLean();
        if (!auth.session) return auth.json;

        const { activeRestaurantId } = auth.session.user;

        // Verify ownership
        const existing = await db.query.restaurantGallery.findFirst({
            where: and(
                eq(restaurantGallery.id, id),
                eq(restaurantGallery.restaurantId, activeRestaurantId)
            ),
            columns: { id: true, title: true },
        });
        if (!existing) {
            return { success: false, error: "Gallery item not found or access denied" };
        }

        const image = parsed.data.image?.[0] ?? null;
        const youtubeId = getYoutubeId(parsed.data.youtube_url ?? "")

        const thumbnail = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
        const youtubeEmbedUrl = `https://www.youtube.com/embed/${youtubeId}`

        await db
            .update(restaurantGallery)
            .set({
                type: parsed.data.type,
                image,
                youtube_url: parsed.data.type === "video" ? youtubeEmbedUrl : null,
                youtube_poster: parsed.data.type === "video" ? thumbnail : null,
                link_url: parsed.data.link_url ?? null,
                title: parsed.data.title ?? null,
                active: parsed.data.active,
                sort_order: parsed.data.sort_order,
                updated_at: new Date(),
            })
            .where(eq(restaurantGallery.id, id));
        logMerchantActivity(auth.session.user, {
            type: "gallery.updated",
            entityId: id,
            data: { name: parsed.data.title ?? "Untitled" },
        });

        return { success: true, data: { id } };
    } catch (error) {
        console.error("Failed to update gallery item:", error);
        return { success: false, error: "Failed to update gallery item" };
    }
}

// Delete a gallery item
export async function deleteGalleryItem(id: string): Promise<ApiResponse<{ id: string }>> {
    try {
        const auth = await ensureAuthenticatedUserLean();
        if (!auth.session) return auth.json;

        const { activeRestaurantId } = auth.session.user;

        const existing = await db.query.restaurantGallery.findFirst({
            where: and(
                eq(restaurantGallery.id, id),
                eq(restaurantGallery.restaurantId, activeRestaurantId)
            ),
            columns: { id: true, title: true },
        });
        if (!existing) {
            return { success: false, error: "Gallery item not found or access denied" };
        }

        await db.delete(restaurantGallery).where(eq(restaurantGallery.id, id));
        logMerchantActivity(auth.session.user, {
            type: "gallery.deleted",
            entityId: id,
            data: { name: existing.title ?? "Untitled" },
        });

        return { success: true, data: { id } };
    } catch (error) {
        console.error("Failed to delete gallery item:", error);
        return { success: false, error: "Failed to delete gallery item" };
    }
}

// Toggle active status
export async function toggleGalleryItemActive(
    id: string,
    active: boolean
): Promise<ApiResponse<{ id: string; active: boolean }>> {
    try {
        const auth = await ensureAuthenticatedUserLean();
        if (!auth.session) return auth.json;

        const { activeRestaurantId } = auth.session.user;

        const existing = await db.query.restaurantGallery.findFirst({
            where: and(
                eq(restaurantGallery.id, id),
                eq(restaurantGallery.restaurantId, activeRestaurantId)
            ),
            columns: { id: true, title: true },
        });
        if (!existing) {
            return { success: false, error: "Gallery item not found or access denied" };
        }

        await db
            .update(restaurantGallery)
            .set({ active, updated_at: new Date() })
            .where(eq(restaurantGallery.id, id));

        logMerchantActivity(auth.session.user, {
            type: "gallery.updated",
            entityId: id,
            data: { name: `${existing.title ?? "Untitled"} · ${active ? "shown" : "hidden"}` },
        });

        return { success: true, data: { id, active } };
    } catch (error) {
        console.error("Failed to toggle gallery item active status:", error);
        return { success: false, error: "Failed to update active status" };
    }
}

// Reorder gallery items 
export async function reorderGalleryItems(
    items: { id: string; sort_order: number }[]
): Promise<ApiResponse<null>> {
    try {
        const auth = await ensureAuthenticatedUserLean();
        if (!auth.session) return auth.json;

        const { activeRestaurantId } = auth.session.user;

        // Verify all items belong to the user's restaurant
        for (const item of items) {
            const existing = await db.query.restaurantGallery.findFirst({
                where: and(
                    eq(restaurantGallery.id, item.id),
                    eq(restaurantGallery.restaurantId, activeRestaurantId)
                ),
                columns: { id: true },
            });
            if (!existing) {
                return { success: false, error: "Access denied for one or more items" };
            }
        }

        await db.transaction(async (tx) => {
            for (const item of items) {
                await tx
                    .update(restaurantGallery)
                    .set({ sort_order: item.sort_order, updated_at: new Date() })
                    .where(eq(restaurantGallery.id, item.id));
            }
        });

        return { success: true, data: null };
    } catch (error) {
        console.error("Failed to reorder gallery items:", error);
        return { success: false, error: "Failed to reorder gallery items" };
    }
}