"use server";

import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/drizzle/db";
import { restaurantLinks } from "@/drizzle/schema";
import { LinkType } from "@/drizzle/types";
import { logMerchantActivity } from "@/lib/activity/log";
import { ensureAuthenticatedUser, ensureAuthenticatedUserLean } from "@/lib/auth/guards";
import { limitAnonymousAction } from "@/lib/rate-limit/guard";
import { checkResourceLimit } from "@/lib/stripe/resource-guard";
import { ApiResponse } from "@/lib/types";
import { linkSchema, LinkSchemaType } from "@/lib/validators/zod/link.schema";

const linkIdSchema = z.uuid();

export async function getRestaurantLinks(): Promise<
    ApiResponse<LinkType[]>
> {
    try {
        const auth = await ensureAuthenticatedUserLean();
        if (!auth.session) {
            return auth.json
        }

        const { activeRestaurantId } = auth.session.user;

        const links = await db.query.restaurantLinks.findMany({
            where: eq(
                restaurantLinks.restaurantId,
                activeRestaurantId
            ),
            orderBy: [
                asc(restaurantLinks.sort_order),
            ],
        });

        return {
            success: true,
            data: links,
        };
    } catch {
        return {
            success: false,
            error: "Failed to fetch links",
        };
    }
}

export async function createRestaurantLink(input: LinkSchemaType): Promise<ApiResponse<{ id: string }>> {
    try {
        const parsed = linkSchema.safeParse(input);

        if (!parsed.success) {
            return {
                success: false,
                error: parsed.error.issues[0]?.message ?? "Invalid input",
            };
        }

        const auth = await ensureAuthenticatedUser();
        if (!auth.session) {
            return auth.json
        }

        const { activeRestaurantId, subscription: { plan } } = auth.session.user;

        const limitCheck = await checkResourceLimit(
            plan,
            'links',
            activeRestaurantId,
            restaurantLinks
        );
        if (!limitCheck.allowed) {
            return { success: false, error: limitCheck.error };
        }

        const lastLink = await db.query.restaurantLinks.findFirst({
            where: eq(
                restaurantLinks.restaurantId,
                activeRestaurantId
            ),
            orderBy: (links, { desc }) => [
                desc(links.sort_order),
            ],
        });

        const sort_order =
            (lastLink?.sort_order ?? -1) + 1;

        const [link] = await db
            .insert(restaurantLinks)
            .values({
                restaurantId: activeRestaurantId,
                title: parsed.data.title,
                url: parsed.data.url,
                icon_key: parsed.data.icon_key,
                sort_order,
            })
            .returning({
                id: restaurantLinks.id,
            });
        logMerchantActivity(auth.session.user, {
            type: "link.created",
            entityId: link.id,
            data: { name: parsed.data.title },
        });

        return {
            success: true,
            data: {
                id: link.id,
            },
        };
    } catch {
        return {
            success: false,
            error: "Failed to create link",
        };
    }
}

export async function updateRestaurantLink(
    id: string,
    input: LinkSchemaType
): Promise<ApiResponse<{ id: string }>> {
    try {
        const parsed = linkSchema.safeParse(input);

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
            .update(restaurantLinks)
            .set({
                title: parsed.data.title,
                url: parsed.data.url,
                icon_key: parsed.data.icon_key,
                active: parsed.data.active,
            })
            .where(
                and(
                    eq(restaurantLinks.id, id),
                    eq(
                        restaurantLinks.restaurantId,
                        activeRestaurantId
                    )
                )
            );

        logMerchantActivity(auth.session.user, {
            type: "link.updated",
            entityId: id,
            data: { name: parsed.data.title },
        });

        return {
            success: true,
            data: {
                id,
            },
        };
    } catch {
        return {
            success: false,
            error: "Failed to update link",
        };
    }
}

export async function toggleRestaurantLinkActive(
    id: string,
    active: boolean
): Promise<ApiResponse<{ id: string; active: boolean }>> {
    try {
        const auth = await ensureAuthenticatedUserLean();

        if (!auth.session) {
            return auth.json;
        }

        const { activeRestaurantId } =
            auth.session.user;

        const [updated] = await db
            .update(restaurantLinks)
            .set({
                active,
            })
            .where(
                and(
                    eq(restaurantLinks.id, id),
                    eq(
                        restaurantLinks.restaurantId,
                        activeRestaurantId
                    )
                )
            )
            .returning({ title: restaurantLinks.title });

        if (updated) {
            logMerchantActivity(auth.session.user, {
                type: "link.updated",
                entityId: id,
                data: { name: `${updated.title} · ${active ? "shown" : "hidden"}` },
            });
        }

        return {
            success: true,
            data: {
                id,
                active,
            },
        };
    } catch {
        return {
            success: false,
            error: "Failed to update link",
        };
    }
}

export async function reorderRestaurantLinks(
    links: {
        id: string;
        sort_order: number;
    }[]
): Promise<ApiResponse<null>> {
    try {
        const auth = await ensureAuthenticatedUserLean();

        if (!auth.session) {
            return auth.json;
        }

        const { activeRestaurantId } = auth.session.user;

        await db.transaction(async (tx) => {
            for (const link of links) {
                await tx
                    .update(restaurantLinks)
                    .set({
                        sort_order: link.sort_order,
                    })
                    .where(
                        and(
                            eq(restaurantLinks.id, link.id),
                            eq(
                                restaurantLinks.restaurantId,
                                activeRestaurantId
                            )
                        )
                    );
            }
        });

        return {
            success: true,
            data: null,
        };
    } catch {
        return {
            success: false,
            error: "Failed to reorder links",
        };
    }
}


export async function trackLinkClick(
    id: string
): Promise<ApiResponse<{ clicks: number }>> {
    const limit = await limitAnonymousAction("track-link-click", "publicTracking");
    if (!limit.allowed) {
        return { success: false, error: "Too many requests. Please try again shortly." };
    }

    try {
        if (!linkIdSchema.safeParse(id).success) {
            return { success: false, error: "Invalid link" };
        }

        const [updated] = await db
            .update(restaurantLinks)
            .set({ clicks: sql`${restaurantLinks.clicks} + 1` })
            .where(eq(restaurantLinks.id, id))
            .returning({ clicks: restaurantLinks.clicks });

        if (!updated) {
            return { success: false, error: "Link not found" };
        }

        return { success: true, data: { clicks: updated.clicks } };
    } catch (error) {
        console.error("Failed to increment link clicks:", error);
        return { success: false, error: "Failed to track link click" };
    }
}

export async function deleteRestaurantLink(
    id: string
): Promise<ApiResponse<{ id: string }>> {
    try {
        const auth = await ensureAuthenticatedUserLean();

        if (!auth.session) {
            return auth.json;
        }

        const { activeRestaurantId } =
            auth.session.user;

        const [deleted] = await db
            .delete(restaurantLinks)
            .where(
                and(
                    eq(restaurantLinks.id, id),
                    eq(
                        restaurantLinks.restaurantId,
                        activeRestaurantId
                    )
                )
            )
            .returning({ title: restaurantLinks.title });

        if (deleted) {
            logMerchantActivity(auth.session.user, {
                type: "link.deleted",
                entityId: id,
                data: { name: deleted.title },
            });
        }

        return {
            success: true,
            data: {
                id,
            },
        };
    } catch {
        return {
            success: false,
            error: "Failed to delete link",
        };
    }
}