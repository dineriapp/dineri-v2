"use server";

import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/drizzle/db";
import { popups } from "@/drizzle/schema";
import { PopupType } from "@/drizzle/types";
import { logMerchantActivity } from "@/lib/activity/log";
import { ensureAuthenticatedUser, ensureAuthenticatedUserLean } from "@/lib/auth/guards";
import { limitAnonymousAction } from "@/lib/rate-limit/guard";
import { checkResourceLimit } from "@/lib/stripe/resource-guard";
import { ApiResponse } from "@/lib/types";
import { popupSchema, PopupSchemaType } from "@/lib/validators/zod/popup.schema";

const popupIdSchema = z.uuid();

export async function getRestaurantPopups(): Promise<ApiResponse<PopupType[]>> {
    try {
        const auth = await ensureAuthenticatedUserLean();
        if (!auth.session) {
            return auth.json;
        }

        const { activeRestaurantId } = auth.session.user;

        const data = await db.query.popups.findMany({
            where: eq(popups.restaurantId, activeRestaurantId),
            orderBy: [desc(popups.createdAt)],
        });

        return {
            success: true,
            data,
        };
    } catch {
        return {
            success: false,
            error: "Failed to fetch popups",
        };
    }
}

export async function createPopup(input: PopupSchemaType): Promise<ApiResponse<{ id: string }>> {
    try {
        const parsed = popupSchema.safeParse(input);

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

        const limitCheck = await checkResourceLimit(plan, "popups", activeRestaurantId, popups);
        if (!limitCheck.allowed) {
            return { success: false, error: limitCheck.error };
        }

        const [popup] = await db
            .insert(popups)
            .values({
                restaurantId: activeRestaurantId,
                badge: parsed.data.badge || null,
                title: parsed.data.title,
                body: parsed.data.body,
                cta: parsed.data.cta,
                ctaUrl: parsed.data.ctaUrl,
                footerNote: parsed.data.footerNote || null,
                onPage: parsed.data.onPage,
                trigger_after_seconds: parsed.data.trigger_after_seconds,
                status: parsed.data.status,
            })
            .returning({ id: popups.id });
        logMerchantActivity(auth.session.user, {
            type: "popup.created",
            entityId: popup.id,
            data: { name: parsed.data.title },
        });

        return {
            success: true,
            data: { id: popup.id },
        };
    } catch {
        return {
            success: false,
            error: "Failed to create popup",
        };
    }
}

export async function updatePopup(
    id: string,
    input: PopupSchemaType,
): Promise<ApiResponse<{ id: string }>> {
    try {
        const parsed = popupSchema.safeParse(input);

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

        await db
            .update(popups)
            .set({
                badge: parsed.data.badge || null,
                title: parsed.data.title,
                body: parsed.data.body,
                cta: parsed.data.cta,
                ctaUrl: parsed.data.ctaUrl,
                footerNote: parsed.data.footerNote || null,
                onPage: parsed.data.onPage,
                trigger_after_seconds: parsed.data.trigger_after_seconds,
                status: parsed.data.status,
            })
            .where(and(eq(popups.id, id), eq(popups.restaurantId, activeRestaurantId)));
        logMerchantActivity(auth.session.user, {
            type: "popup.updated",
            entityId: id,
            data: { name: parsed.data.title },
        });

        return {
            success: true,
            data: { id },
        };
    } catch {
        return {
            success: false,
            error: "Failed to update popup",
        };
    }
}

export async function togglePopupStatus(
    id: string,
    status: "live" | "paused",
): Promise<ApiResponse<{ id: string; status: "live" | "paused" }>> {
    try {
        const auth = await ensureAuthenticatedUserLean();
        if (!auth.session) {
            return auth.json;
        }

        const { activeRestaurantId } = auth.session.user;

        const [updated] = await db
            .update(popups)
            .set({ status })
            .where(and(eq(popups.id, id), eq(popups.restaurantId, activeRestaurantId)))
            .returning({ title: popups.title });

        if (updated) {
            logMerchantActivity(auth.session.user, {
                type: "popup.updated",
                entityId: id,
                data: { name: `${updated.title} · ${status}` },
            });
        }

        return {
            success: true,
            data: { id, status },
        };
    } catch {
        return {
            success: false,
            error: "Failed to update popup",
        };
    }
}

export async function trackPopupImpression(
    id: string,
): Promise<ApiResponse<{ impressions: number }>> {

    const limit = await limitAnonymousAction("track-popup-impression", "publicTracking");
    if (!limit.allowed) {
        return { success: false, error: "Too many requests. Please try again shortly." };
    }

    try {
        if (!popupIdSchema.safeParse(id).success) {
            return { success: false, error: "Invalid popup" };
        }

        const [updated] = await db
            .update(popups)
            .set({ impressions: sql`${popups.impressions} + 1` })
            .where(eq(popups.id, id))
            .returning({ impressions: popups.impressions });

        if (!updated) {
            return { success: false, error: "Popup not found" };
        }

        return {
            success: true,
            data: { impressions: updated.impressions },
        };
    } catch (error) {
        console.error("Failed to increment popup impressions:", error);
        return {
            success: false,
            error: "Failed to track popup impression",
        };
    }
}

export async function trackPopupClick(
    id: string,
): Promise<ApiResponse<{ ctaUrl: string; clicks: number }>> {

    const limit = await limitAnonymousAction("track-popup-click", "publicTracking");
    if (!limit.allowed) {
        return { success: false, error: "Too many requests. Please try again shortly." };
    }

    try {
        if (!popupIdSchema.safeParse(id).success) {
            return { success: false, error: "Invalid popup" };
        }

        const [updated] = await db
            .update(popups)
            .set({ clicks: sql`${popups.clicks} + 1` })
            .where(eq(popups.id, id))
            .returning({ clicks: popups.clicks, ctaUrl: popups.ctaUrl });

        if (!updated) {
            return { success: false, error: "Popup not found" };
        }

        return {
            success: true,
            data: { ctaUrl: updated.ctaUrl, clicks: updated.clicks },
        };
    } catch (error) {
        console.error("Failed to increment popup clicks:", error);
        return {
            success: false,
            error: "Failed to track popup click",
        };
    }
}

export async function deletePopup(id: string): Promise<ApiResponse<{ id: string }>> {
    try {
        const auth = await ensureAuthenticatedUserLean();
        if (!auth.session) {
            return auth.json;
        }

        const { activeRestaurantId } = auth.session.user;

        const [deleted] = await db
            .delete(popups)
            .where(and(eq(popups.id, id), eq(popups.restaurantId, activeRestaurantId)))
            .returning({ title: popups.title });

        if (deleted) {
            logMerchantActivity(auth.session.user, {
                type: "popup.deleted",
                entityId: id,
                data: { name: deleted.title },
            });
        }

        return {
            success: true,
            data: { id },
        };
    } catch {
        return {
            success: false,
            error: "Failed to delete popup",
        };
    }
}
