import "server-only";

import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { v4 as uuid } from "uuid";

export const s3 = new S3Client({
    region: process.env.AWS_BUCKET_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_BUCKET_ACCESS_KEY!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export const BUCKET = process.env.AWS_BUCKET_NAME!;
const REGION = process.env.AWS_BUCKET_REGION!;

export function publicS3Url(key: string) {
    return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}


export async function uploadFileToS3(
    file: File,
    folder: string,
): Promise<{ url: string; key: string }> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `${folder}/${uuid()}-${safeName}`;

    await s3.send(
        new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: buffer,
            ContentType: file.type,
        }),
    );

    return { url: publicS3Url(key), key };
}

export async function deleteS3Objects(inputs: string[]): Promise<{
    success: boolean;
    deleted: string[];
    failed: string[];
}> {
    const keys = inputs
        .filter(Boolean)
        .map((input) => {
            try {
                if (input.startsWith("http")) {
                    return decodeURIComponent(new URL(input).pathname.slice(1));
                }
                return input;
            } catch {
                return input;
            }
        });

    // Deduplicate keys
    const uniqueKeys = [...new Set(keys)];

    if (uniqueKeys.length === 0) {
        return { success: true, deleted: [], failed: [] };
    }

    const results = await Promise.allSettled(
        uniqueKeys.map((key) =>
            s3.send(
                new DeleteObjectCommand({
                    Bucket: BUCKET,
                    Key: key,
                })
            )
        )
    );

    const deleted: string[] = [];
    const failed: string[] = [];

    results.forEach((res, idx) => {
        const key = uniqueKeys[idx];
        if (res.status === "fulfilled") {
            deleted.push(key);
        } else {
            failed.push(key);
            console.warn(`⚠️ Failed to delete [${key}]:`, res.reason);
        }
    });

    return {
        success: failed.length === 0,
        deleted,
        failed,
    };
}