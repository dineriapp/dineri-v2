"use server";
import { ensureAuthenticatedUserLean } from "@/lib/auth/guards";
import { BUCKET, s3 } from "@/lib/aws";
import { partitionKeysByOwnership } from "@/lib/server/func/s3-ownership";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export async function deleteS3Objects(inputs: string[]): Promise<{
  success: boolean;
  deleted: string[];
  failed: string[];
}> {
  const auth = await ensureAuthenticatedUserLean();
  if (!auth.session) {
    return { success: false, deleted: [], failed: inputs };
  }

  const { activeRestaurantId } = auth.session.user;
  if (!activeRestaurantId) {
    return { success: false, deleted: [], failed: inputs };
  }

  const { allowed, denied } = await partitionKeysByOwnership(inputs, activeRestaurantId);

  if (denied.length) {
    console.warn("Refused S3 delete for keys outside the caller's restaurant:", {
      restaurantId: activeRestaurantId,
      denied,
    });
  }

  if (allowed.length === 0) {
    return { success: denied.length === 0, deleted: [], failed: denied };
  }

  const results = await Promise.allSettled(
    allowed.map((key) =>
      s3.send(
        new DeleteObjectCommand({
          Bucket: BUCKET,
          Key: key,
        }),
      ),
    ),
  );

  const deleted: string[] = [];
  const failed: string[] = [...denied];

  results.forEach((res, idx) => {
    const key = allowed[idx];
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
