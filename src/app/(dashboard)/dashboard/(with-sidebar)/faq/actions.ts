"use server";

import { db } from "@/drizzle/db";
import { faqCategories, faqs } from "@/drizzle/schema";
import { FaqCategoryWithItems } from "@/drizzle/types";
import { logMerchantActivity } from "@/lib/activity/log";
import { ensureAuthenticatedUser, ensureAuthenticatedUserLean } from "@/lib/auth/guards";
import { checkResourceLimit, checkResourceLimitWithCount } from "@/lib/stripe/resource-guard";
import { ApiResponse } from "@/lib/types";
import {
  faqCategorySchema,
  FaqCategorySchemaType,
  faqSchema,
  FaqSchemaType,
} from "@/lib/validators/zod/faq.schema";
import { and, asc, eq, sql } from "drizzle-orm";

export async function getFaqCategoryWithItems(): Promise<ApiResponse<FaqCategoryWithItems[]>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }

    const { activeRestaurantId } = auth.session.user;

    const categories = await db.query.faqCategories.findMany({
      where: eq(faqCategories.restaurantId, activeRestaurantId),
      orderBy: [asc(faqCategories.sort_order)],
      with: {
        items: {
          orderBy: [asc(faqs.sort_order)],
        },
      },
    });

    return {
      success: true,
      data: categories,
    };
  } catch (error) {
    console.error("Failed to fetch FAQs with categories:", error);
    return {
      success: false,
      error: "Failed to fetch FAQs",
    };
  }
}

// Create FAQ category
export async function createFaqCategory(
  input: FaqCategorySchemaType,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const parsed = faqCategorySchema.safeParse(input);
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

    const limitCheck = await checkResourceLimit(plan, "faq", activeRestaurantId, faqCategories);
    if (!limitCheck.allowed) {
      return { success: false, error: limitCheck.error };
    }

    const lastCategory = await db.query.faqCategories.findFirst({
      where: eq(faqCategories.restaurantId, activeRestaurantId),
      orderBy: (categories, { desc }) => [desc(categories.sort_order)],
      columns: { sort_order: true },
    });

    const sort_order = (lastCategory?.sort_order ?? -1) + 1;

    const [category] = await db
      .insert(faqCategories)
      .values({
        restaurantId: activeRestaurantId,
        name: parsed.data.name,
        active: parsed.data.active,
        sort_order,
      })
      .returning({ id: faqCategories.id });

    logMerchantActivity(auth.session.user, {
      type: "faq.category.created",
      entityId: category.id,
      data: { name: parsed.data.name },
    });

    return {
      success: true,
      data: { id: category.id },
    };
  } catch (error) {
    console.error("Failed to create FAQ category:", error);
    return {
      success: false,
      error: "Failed to create category",
    };
  }
}

// Update FAQ category
export async function updateFaqCategory(
  id: string,
  input: FaqCategorySchemaType,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const parsed = faqCategorySchema.safeParse(input);
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

    const existingCategory = await db.query.faqCategories.findFirst({
      where: and(eq(faqCategories.id, id), eq(faqCategories.restaurantId, activeRestaurantId)),
      columns: { id: true },
    });
    if (!existingCategory) {
      return {
        success: false,
        error: "Category not found or access denied",
      };
    }

    await db
      .update(faqCategories)
      .set({
        name: parsed.data.name,
        active: parsed.data.active,
        sort_order: parsed.data.sort_order,
      })
      .where(eq(faqCategories.id, id));

    logMerchantActivity(auth.session.user, {
      type: "faq.category.updated",
      entityId: id,
      data: { name: parsed.data.name },
    });

    return {
      success: true,
      data: { id },
    };
  } catch (error) {
    console.error("Failed to update FAQ category:", error);
    return {
      success: false,
      error: "Failed to update category",
    };
  }
}

// Delete FAQ category
export async function deleteFaqCategory(id: string): Promise<ApiResponse<{ id: string }>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }

    const { activeRestaurantId } = auth.session.user;

    const existingCategory = await db.query.faqCategories.findFirst({
      where: and(eq(faqCategories.id, id), eq(faqCategories.restaurantId, activeRestaurantId)),
      columns: { id: true, name: true },
    });
    if (!existingCategory) {
      return {
        success: false,
        error: "Category not found or access denied",
      };
    }

    await db
      .delete(faqCategories)
      .where(and(eq(faqCategories.id, id), eq(faqCategories.restaurantId, activeRestaurantId)));

    logMerchantActivity(auth.session.user, {
      type: "faq.category.deleted",
      entityId: id,
      data: { name: existingCategory.name },
    });

    return {
      success: true,
      data: { id },
    };
  } catch (error) {
    console.error("Failed to delete FAQ category:", error);
    return {
      success: false,
      error: "Failed to delete category",
    };
  }
}

// Reorder FAQ categories
export async function reorderFaqCategories(
  categories: { id: string; sort_order: number }[],
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
          .update(faqCategories)
          .set({ sort_order: cat.sort_order })
          .where(
            and(eq(faqCategories.id, cat.id), eq(faqCategories.restaurantId, activeRestaurantId)),
          );
      }
    });

    return { success: true, data: null };
  } catch (error) {
    console.error("Failed to reorder FAQ categories:", error);
    return { success: false, error: "Failed to reorder categories" };
  }
}

export async function toggleFaqCategoryActive(
  id: string,
  active: boolean,
): Promise<ApiResponse<{ id: string; active: boolean }>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) return auth.json;
    const { activeRestaurantId } = auth.session.user;

    const category = await db.query.faqCategories.findFirst({
      where: and(eq(faqCategories.id, id), eq(faqCategories.restaurantId, activeRestaurantId)),
      columns: { id: true, name: true },
    });
    if (!category) {
      return { success: false, error: "Category not found or access denied" };
    }

    await db.update(faqCategories).set({ active }).where(eq(faqCategories.id, id));

    logMerchantActivity(auth.session.user, {
      type: "faq.category.updated",
      entityId: id,
      data: { name: `${category.name} · ${active ? "shown" : "hidden"}` },
    });

    return { success: true, data: { id, active } };
  } catch (error) {
    console.error("Failed to toggle FAQ category visibility:", error);
    return { success: false, error: "Failed to update category visibility" };
  }
}

export async function createFaq(input: FaqSchemaType): Promise<ApiResponse<{ id: string }>> {
  try {
    const parsed = faqSchema.safeParse(input);
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

    const category = await db.query.faqCategories.findFirst({
      where: and(
        eq(faqCategories.id, parsed.data.categoryId),
        eq(faqCategories.restaurantId, activeRestaurantId),
      ),
      columns: { id: true },
    });
    if (!category) {
      return {
        success: false,
        error: "Category not found or does not belong to your restaurant",
      };
    }

    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(faqs)
      .where(eq(faqs.categoryId, category.id));

    const limitCheck = await checkResourceLimitWithCount(
      plan,
      "items_per_category",
      result.count ?? 0,
    );
    if (!limitCheck.allowed) {
      return { success: false, error: limitCheck.error };
    }

    const lastFaq = await db.query.faqs.findFirst({
      where: eq(faqs.categoryId, parsed.data.categoryId),
      orderBy: (faq, { desc }) => [desc(faq.sort_order)],
      columns: { sort_order: true },
    });
    const sort_order = (lastFaq?.sort_order ?? -1) + 1;

    const [newFaq] = await db
      .insert(faqs)
      .values({
        categoryId: parsed.data.categoryId,
        question: parsed.data.question,
        answer: parsed.data.answer,
        active: parsed.data.active,
        sort_order,
      })
      .returning({ id: faqs.id });

    logMerchantActivity(auth.session.user, {
      type: "faq.created",
      entityId: newFaq.id,
      data: { name: parsed.data.question },
    });

    return {
      success: true,
      data: { id: newFaq.id },
    };
  } catch (error) {
    console.error("Failed to create FAQ:", error);
    return {
      success: false,
      error: "Failed to create FAQ",
    };
  }
}

export async function updateFaq(
  id: string,
  input: FaqSchemaType,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const parsed = faqSchema.safeParse(input);
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

    const existing = await db.query.faqs.findFirst({
      where: eq(faqs.id, id),
      with: {
        category: {
          columns: { restaurantId: true },
        },
      },
      columns: { id: true },
    });
    if (!existing || existing.category.restaurantId !== activeRestaurantId) {
      return {
        success: false,
        error: "FAQ not found or access denied",
      };
    }

    // Moving a question between categories must not move it between venues.
    const newCategory = await db.query.faqCategories.findFirst({
      where: and(
        eq(faqCategories.id, parsed.data.categoryId),
        eq(faqCategories.restaurantId, activeRestaurantId),
      ),
      columns: { id: true },
    });
    if (!newCategory) {
      return {
        success: false,
        error: "Target category not found or does not belong to your restaurant",
      };
    }

    await db
      .update(faqs)
      .set({
        categoryId: parsed.data.categoryId,
        question: parsed.data.question,
        answer: parsed.data.answer,
        active: parsed.data.active,
        sort_order: parsed.data.sort_order,
      })
      .where(eq(faqs.id, id));

    logMerchantActivity(auth.session.user, {
      type: "faq.updated",
      entityId: id,
      data: { name: parsed.data.question },
    });

    return {
      success: true,
      data: { id },
    };
  } catch (error) {
    console.error("Failed to update FAQ:", error);
    return {
      success: false,
      error: "Failed to update FAQ",
    };
  }
}

export async function toggleFaqActive(
  id: string,
  active: boolean,
): Promise<ApiResponse<{ id: string; active: boolean }>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }

    const { activeRestaurantId } = auth.session.user;

    const existing = await db.query.faqs.findFirst({
      where: eq(faqs.id, id),
      with: {
        category: {
          columns: { restaurantId: true },
        },
      },
      columns: { id: true, question: true },
    });
    if (!existing || existing.category.restaurantId !== activeRestaurantId) {
      return {
        success: false,
        error: "FAQ not found or access denied",
      };
    }

    await db.update(faqs).set({ active }).where(eq(faqs.id, id));

    logMerchantActivity(auth.session.user, {
      type: "faq.updated",
      entityId: id,
      data: { name: `${existing.question} · ${active ? "shown" : "hidden"}` },
    });

    return {
      success: true,
      data: { id, active },
    };
  } catch (error) {
    console.error("Failed to toggle FAQ:", error);
    return {
      success: false,
      error: "Failed to update FAQ visibility",
    };
  }
}

export async function deleteFaq(id: string): Promise<ApiResponse<{ id: string }>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) {
      return auth.json;
    }

    const { activeRestaurantId } = auth.session.user;

    const existing = await db.query.faqs.findFirst({
      where: eq(faqs.id, id),
      with: {
        category: {
          columns: { restaurantId: true },
        },
      },
      columns: { id: true, question: true },
    });
    if (!existing || existing.category.restaurantId !== activeRestaurantId) {
      return {
        success: false,
        error: "FAQ not found or access denied",
      };
    }

    await db.delete(faqs).where(eq(faqs.id, id));

    logMerchantActivity(auth.session.user, {
      type: "faq.deleted",
      entityId: id,
      data: { name: existing.question },
    });

    return {
      success: true,
      data: { id },
    };
  } catch (error) {
    console.error("Failed to delete FAQ:", error);
    return {
      success: false,
      error: "Failed to delete FAQ",
    };
  }
}

export async function reorderFaqs(
  items: { id: string; sort_order: number }[],
): Promise<ApiResponse<null>> {
  try {
    const auth = await ensureAuthenticatedUserLean();
    if (!auth.session) return auth.json;
    const { activeRestaurantId } = auth.session.user;

    for (const item of items) {
      const existing = await db.query.faqs.findFirst({
        where: eq(faqs.id, item.id),
        with: {
          category: {
            columns: { restaurantId: true },
          },
        },
        columns: { id: true },
      });
      if (!existing || existing.category.restaurantId !== activeRestaurantId) {
        return { success: false, error: "Access denied for one or more questions" };
      }
    }

    await db.transaction(async (tx) => {
      for (const item of items) {
        await tx.update(faqs).set({ sort_order: item.sort_order }).where(eq(faqs.id, item.id));
      }
    });

    return { success: true, data: null };
  } catch (error) {
    console.error("Failed to reorder FAQs:", error);
    return { success: false, error: "Failed to reorder FAQs" };
  }
}
