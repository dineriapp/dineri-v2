import "server-only";

import { db } from "@/drizzle/db";
import {
  menuCategories,
  menuItems,
  restaurant,
  restaurantGallery,
  successStories,
} from "@/drizzle/schema";
import { publicS3Url } from "@/lib/aws";
import { and, eq, inArray, sql } from "drizzle-orm";
import { v4 as uuid } from "uuid";

const UPLOAD_ROOT = "r";

export function buildRestaurantUploadKey(restaurantId: string, fileName: string): string {
  return `${UPLOAD_ROOT}/${restaurantId}/${uuid()}-${fileName}`;
}

export function ownerFromKey(key: string): string | null {
  const [root, restaurantId, ...rest] = key.split("/");
  if (root !== UPLOAD_ROOT || !restaurantId || rest.length === 0) return null;
  return restaurantId;
}

export function toBucketKey(input: string): string | null {
  const value = input?.trim();
  if (!value) return null;

  if (!/^https?:\/\//i.test(value)) {
    return value.startsWith("/") ? null : value;
  }

  try {
    const url = new URL(value);
    const expected = new URL(publicS3Url("")).host;
    if (url.host !== expected) return null;
    const key = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
    return key || null;
  } catch {
    return null;
  }
}

async function legacyKeysOwnedByRestaurant(
  keys: string[],
  restaurantId: string,
): Promise<Set<string>> {
  const owned = new Set<string>();
  if (keys.length === 0) return owned;

  const urls = keys.map(publicS3Url);

  const [restaurantRow, galleryRows, menuRows, storyRows] = await Promise.all([
    db.query.restaurant.findFirst({
      where: eq(restaurant.id, restaurantId),
      columns: { logo: true, appearance_settings: true },
    }),
    db
      .select({ image: restaurantGallery.image })
      .from(restaurantGallery)
      .where(
        and(
          eq(restaurantGallery.restaurantId, restaurantId),
          inArray(sql`${restaurantGallery.image}->>'key'`, keys),
        ),
      ),
    db
      .select({ image: menuItems.image })
      .from(menuItems)
      .innerJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
      .where(
        and(
          eq(menuCategories.restaurantId, restaurantId),
          inArray(sql`${menuItems.image}->>'key'`, keys),
        ),
      ),
    db
      .select({ image: successStories.image })
      .from(successStories)
      .where(
        and(
          eq(successStories.restaurantId, restaurantId),
          inArray(sql`${successStories.image}->>'key'`, keys),
        ),
      ),
  ]);

  for (const row of [...galleryRows, ...menuRows, ...storyRows]) {
    if (row.image?.key) owned.add(row.image.key);
  }

  if (restaurantRow?.logo?.key) owned.add(restaurantRow.logo.key);

  const appearance = restaurantRow?.appearance_settings;
  for (const candidate of [appearance?.cover_image, appearance?.bg_image]) {
    if (!candidate) continue;
    const index = urls.indexOf(candidate);
    if (index !== -1) owned.add(keys[index]);
    const asKey = toBucketKey(candidate);
    if (asKey && keys.includes(asKey)) owned.add(asKey);
  }

  return owned.size ? new Set(keys.filter((k) => owned.has(k))) : owned;
}

export type S3OwnershipResult = {
  allowed: string[];
  denied: string[];
};

export async function partitionKeysByOwnership(
  inputs: string[],
  restaurantId: string,
): Promise<S3OwnershipResult> {
  const allowed: string[] = [];
  const denied: string[] = [];
  const legacy: string[] = [];

  const seen = new Set<string>();
  for (const input of inputs) {
    const key = toBucketKey(input);
    if (!key || seen.has(key)) {
      if (!key && input) denied.push(input);
      continue;
    }
    seen.add(key);

    const owner = ownerFromKey(key);
    if (owner === null) legacy.push(key);
    else if (owner === restaurantId) allowed.push(key);
    else denied.push(key);
  }

  if (legacy.length) {
    const owned = await legacyKeysOwnedByRestaurant(legacy, restaurantId);
    for (const key of legacy) (owned.has(key) ? allowed : denied).push(key);
  }

  return { allowed, denied };
}
