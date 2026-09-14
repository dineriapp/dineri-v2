"use server";

import { db } from "@/drizzle/db";
import { qrCodes } from "@/drizzle/schema";
import { QRCodeType } from "@/drizzle/types";
import { logMerchantActivity } from "@/lib/activity/log";
import { ensureAuthenticatedUser, ensureAuthenticatedUserLean } from "@/lib/auth/guards";
import { limitApi } from "@/lib/rate-limit/guard";
import { bumpQRCodeScanCount } from "@/lib/server/func/qr-scans";
import { checkResourceLimit } from "@/lib/stripe/resource-guard";
import { ApiResponse } from "@/lib/types";
import { qrCodeSchema, QRCodeSchemaType } from "@/lib/validators/zod/qr-code.schema";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

// GET all QR codes
export async function getRestaurantQRCodes(): Promise<ApiResponse<QRCodeType[]>> {
    try {
        const auth = await ensureAuthenticatedUserLean();
        if (!auth.session) return auth.json;
        const { activeRestaurantId } = auth.session.user;

        const qrList = await db.query.qrCodes.findMany({
            where: eq(qrCodes.restaurantId, activeRestaurantId),
            orderBy: [desc(qrCodes.createdAt)],
        });

        return { success: true, data: qrList };
    } catch (error) {
        console.error("Failed to fetch QR codes:", error);
        return { success: false, error: "Failed to fetch QR codes" };
    }
}

// CREATE QR code
export async function createQRCode(
    input: QRCodeSchemaType
): Promise<ApiResponse<QRCodeType>> {
    try {
        const auth = await ensureAuthenticatedUser();
        if (!auth.session) return auth.json;
        const { activeRestaurantId, subscription: { plan } } = auth.session.user;

        const parsed = qrCodeSchema.safeParse(input);
        if (!parsed.success) {
            return { success: false, error: "Invalid Body!" };
        }

        const limitCheck = await checkResourceLimit(
            plan,
            'qrCodes',
            activeRestaurantId,
            qrCodes
        );
        if (!limitCheck.allowed) {
            return { success: false, error: limitCheck.error };
        }

        const [newQr] = await db
            .insert(qrCodes)
            .values({
                restaurantId: activeRestaurantId,
                label: input.label,
                targetUrl: input.targetUrl,
                foregroundColor: input.foregroundColor,
                backgroundColor: input.backgroundColor,
                shape: input.shape,
            })
            .returning();
        logMerchantActivity(auth.session.user, {
            type: "qr.created",
            entityId: newQr.id,
            data: { name: newQr.label },
        });

        return { success: true, data: newQr };
    } catch (error) {
        console.error("Failed to create QR code:", error);
        return { success: false, error: "Failed to create QR code" };
    }
}

// UPDATE QR code
export async function updateQRCode(
    qrId: string,
    input: QRCodeSchemaType
): Promise<ApiResponse<QRCodeType>> {
    try {
        const auth = await ensureAuthenticatedUserLean();
        if (!auth.session) return auth.json;
        const { activeRestaurantId } = auth.session.user;

        // Verify ownership
        const existing = await db.query.qrCodes.findFirst({
            where: and(
                eq(qrCodes.id, qrId),
                eq(qrCodes.restaurantId, activeRestaurantId)
            ),
            columns: {
                id: true
            }
        });
        if (!existing) return { success: false, error: "QR code not found" };

        const parsed = qrCodeSchema.safeParse({ id: qrId, ...input });
        if (!parsed.success) {
            return { success: false, error: "Invalid Body!" };
        }

        const [updated] = await db
            .update(qrCodes)
            .set({
                label: input.label,
                targetUrl: input.targetUrl,
                foregroundColor: input.foregroundColor,
                backgroundColor: input.backgroundColor,
                shape: input.shape,
                updatedAt: new Date(),
            })
            .where(eq(qrCodes.id, qrId))
            .returning();
        logMerchantActivity(auth.session.user, {
            type: "qr.updated",
            entityId: qrId,
            data: { name: updated.label },
        });

        return { success: true, data: updated };
    } catch (error) {
        console.error("Failed to update QR code:", error);
        return { success: false, error: "Failed to update QR code" };
    }
}

// DELETE QR code
export async function deleteQRCode(qrId: string): Promise<ApiResponse<{ id: string }>> {
    try {
        const auth = await ensureAuthenticatedUserLean();
        if (!auth.session) return auth.json;
        const { activeRestaurantId } = auth.session.user;

        const deleted = await db
            .delete(qrCodes)
            .where(
                and(
                    eq(qrCodes.id, qrId),
                    eq(qrCodes.restaurantId, activeRestaurantId)
                )
            )
            .returning({ id: qrCodes.id, label: qrCodes.label });

        if (!deleted.length) return { success: false, error: "QR code not found" };
        logMerchantActivity(auth.session.user, {
            type: "qr.deleted",
            entityId: deleted[0].id,
            data: { name: deleted[0].label },
        });

        revalidatePath("/dashboard/qr-codes");
        return { success: true, data: { id: deleted[0].id } };
    } catch (error) {
        console.error("Failed to delete QR code:", error);
        return { success: false, error: "Failed to delete QR code" };
    }
}

export async function incrementQRCodeScans(
    id: string
): Promise<ApiResponse<{ scans: number }>> {
    const limit = await limitApi("qr-scan", "qrScan", await headers());
    if (!limit.allowed) {
        return { success: false, error: "Too many scans. Please try again shortly." };
    }

    try {
        const scans = await bumpQRCodeScanCount(id);

        if (scans === null) {
            return { success: false, error: "QR code not found" };
        }

        return {
            success: true,
            data: { scans },
        };
    } catch (error) {
        console.error("Failed to increment scans:", error);
        return {
            success: false,
            error: "Failed to increment scans",
        };
    }
}