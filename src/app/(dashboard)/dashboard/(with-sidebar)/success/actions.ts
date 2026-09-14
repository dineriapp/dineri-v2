"use server";

import { db } from "@/drizzle/db";
import { successStories } from "@/drizzle/schema";
import { SuccessStoryType } from "@/drizzle/types";
import { logMerchantActivity } from "@/lib/activity/log";
import { ensureAuthenticatedUser, ensureAuthenticatedUserLean } from "@/lib/auth/guards";
import { deleteS3Objects } from "@/lib/aws";
import { hasFeature } from "@/lib/stripe/checkers";
import { ApiResponse } from "@/lib/types";
import {
  successStorySchema,
  SuccessStorySchemaType,
} from "@/lib/validators/zod/success-story.schema";
import { and, asc, eq } from "drizzle-orm";

export async function getSuccessStories(): Promise<ApiResponse<SuccessStoryType[]>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }

    const { activeRestaurantId } = auth.session.user;

    const stories = await db.query.successStories.findMany({
      where: eq(successStories.restaurantId, activeRestaurantId),
      orderBy: [asc(successStories.sort_order)],
    });

    return {
      success: true,
      data: stories,
    };
  } catch (error) {
    console.error("Failed to fetch success stories:", error);
    return {
      success: false,
      error: "Failed to fetch success stories",
    };
  }
}

export async function createSuccessStory(
  input: SuccessStorySchemaType,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const parsed = successStorySchema.safeParse(input);
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

    const {
      activeRestaurantId,
      subscription: { plan },
    } = auth.session.user;

    const canUseSuccessStory = hasFeature(plan, "success_story");
    if (!canUseSuccessStory) {
      return {
        success: false,
        error: `The Success Story feature is not included in the ${plan} plan. Please upgrade to access it.`,
      };
    }

    // Get last sort_order for this restaurant
    const lastStory = await db.query.successStories.findFirst({
      where: eq(successStories.restaurantId, activeRestaurantId),
      orderBy: (stories, { desc }) => [desc(stories.sort_order)],
      columns: {
        id: true,
        sort_order: true,
      },
    });
    const sort_order = (lastStory?.sort_order ?? -1) + 1;

    const [newStory] = await db
      .insert(successStories)
      .values({
        restaurantId: activeRestaurantId,
        title: parsed.data.title,
        body: parsed.data.body,
        image: parsed.data.image[0],
        active: parsed.data.active,
        sort_order,
      })
      .returning({ id: successStories.id });
    logMerchantActivity(auth.session.user, {
      type: "story.created",
      entityId: newStory.id,
      data: { name: parsed.data.title },
    });

    return {
      success: true,
      data: { id: newStory.id },
    };
  } catch (error) {
    console.error("Failed to create success story:", error);
    return {
      success: false,
      error: "Failed to create success story",
    };
  }
}

export async function updateSuccessStory(
  id: string,
  input: SuccessStorySchemaType,
): Promise<ApiResponse<{ id: string }>> {
  try {
    // Validate input (including id)
    const parsed = successStorySchema.safeParse({ ...input, id });
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

    // Verify story belongs to this restaurant
    const existing = await db.query.successStories.findFirst({
      where: and(eq(successStories.id, id), eq(successStories.restaurantId, activeRestaurantId)),
      columns: {
        id: true,
      },
    });
    if (!existing) {
      return {
        success: false,
        error: "Success story not found or access denied",
      };
    }

    await db
      .update(successStories)
      .set({
        title: parsed.data.title,
        body: parsed.data.body,
        image: parsed.data.image[0],
        active: parsed.data.active,
      })
      .where(eq(successStories.id, id));
    logMerchantActivity(auth.session.user, {
      type: "story.updated",
      entityId: id,
      data: { name: parsed.data.title },
    });

    return {
      success: true,
      data: { id },
    };
  } catch (error) {
    console.error("Failed to update success story:", error);
    return {
      success: false,
      error: "Failed to update success story",
    };
  }
}

export async function toggleSuccessStoryActive(
  id: string,
  active: boolean,
): Promise<ApiResponse<{ id: string; active: boolean }>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }

    const { activeRestaurantId } = auth.session.user;

    // Verify story belongs to this restaurant
    const existing = await db.query.successStories.findFirst({
      where: and(eq(successStories.id, id), eq(successStories.restaurantId, activeRestaurantId)),
      columns: { id: true, title: true },
    });
    if (!existing) {
      return {
        success: false,
        error: "Success story not found or access denied",
      };
    }

    await db.update(successStories).set({ active }).where(eq(successStories.id, id));

    logMerchantActivity(auth.session.user, {
      type: "story.updated",
      entityId: id,
      data: { name: `${existing.title} · ${active ? "shown" : "hidden"}` },
    });

    return {
      success: true,
      data: { id, active },
    };
  } catch (error) {
    console.error("Failed to toggle success story:", error);
    return {
      success: false,
      error: "Failed to update story visibility",
    };
  }
}

export async function deleteSuccessStory(id: string): Promise<ApiResponse<{ id: string }>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }

    const { activeRestaurantId } = auth.session.user;

    // Verify story belongs to this restaurant
    const existing = await db.query.successStories.findFirst({
      where: and(eq(successStories.id, id), eq(successStories.restaurantId, activeRestaurantId)),
      columns: { id: true, title: true },
    });
    if (!existing) {
      return {
        success: false,
        error: "Success story not found or access denied",
      };
    }

    const del = await db
      .delete(successStories)
      .where(eq(successStories.id, id))
      .returning({ image: successStories.image });

    deleteS3Objects([del[0].image.url]).then(() => {});
    logMerchantActivity(auth.session.user, {
      type: "story.deleted",
      entityId: id,
      data: { name: existing.title },
    });

    return {
      success: true,
      data: { id },
    };
  } catch (error) {
    console.error("Failed to delete success story:", error);
    return {
      success: false,
      error: "Failed to delete success story",
    };
  }
}

export async function reorderSuccessStories(
  items: { id: string; sort_order: number }[],
): Promise<ApiResponse<null>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) return auth.json;
    const { activeRestaurantId } = auth.session.user;

    await db.transaction(async (tx) => {
      for (const item of items) {
        await tx
          .update(successStories)
          .set({ sort_order: item.sort_order })
          .where(
            and(
              eq(successStories.id, item.id),
              eq(successStories.restaurantId, activeRestaurantId),
            ),
          );
      }
    });

    return { success: true, data: null };
  } catch (error) {
    console.error("Failed to reorder success stories:", error);
    return { success: false, error: "Failed to reorder stories" };
  }
}
