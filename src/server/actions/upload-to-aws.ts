"use server";

import { ensureAuthenticatedUserLean } from "@/lib/auth/guards";
import { BUCKET, publicS3Url, s3 } from "@/lib/aws";
import { limitUserAction } from "@/lib/rate-limit/guard";
import { buildRestaurantUploadKey } from "@/lib/server/func/s3-ownership";
import { acceptedTypes } from "@/lib/utils";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const maxFileSize = 1024 * 1024 * 10;

export async function getSignedURL(
    type: string,
    size: number,
    checksum: string,
    name: string
) {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) return { success: false, error: "Login required." };

    const limit = await limitUserAction("signed-upload", auth.session.user.id, "signedUpload");
    if (!limit.allowed) {
        return { success: false, error: "Too many uploads. Please wait a moment and try again." };
    }

    if (!acceptedTypes.includes(type)) {
        return { success: false, error: "Invalid File Type" };
    }

    if (size > maxFileSize) {
        return { success: false, error: "File too large" };
    }

    const { activeRestaurantId } = auth.session.user;
    if (!activeRestaurantId) {
        return { success: false, error: "No active restaurant." };
    }

    const key = buildRestaurantUploadKey(activeRestaurantId, name);

    const putOriginal = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: type,
        ContentLength: size,
        ChecksumSHA256: checksum,
        CacheControl: "public, max-age=31536000, immutable",
    });

    const uploadUrl = await getSignedUrl(s3, putOriginal, { expiresIn: 60 });

    return {
        success: true,
        data: {
            uploadUrl,
            publicUrl: publicS3Url(key),
            key,
        },
    };
}
