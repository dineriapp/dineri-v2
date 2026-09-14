import { db } from "@/drizzle/db";
import { menuCategories, menuItems, restaurant } from "@/drizzle/schema";
import { hasFeature } from "@/lib/stripe/checkers";
import { getRestaurantOwnerPlan } from "@/lib/stripe/get-restaurant-owner-plan";
import { eq } from "drizzle-orm";

export const getRestaurantWithMenu = async (slug: string) => {
  const restaurant_record = await db.query.restaurant.findFirst({
    where: eq(restaurant.slug, slug),
    columns: {
      id: true,
      name: true,
      slug: true,
      timezone: true,
      opening_hours: true,
      appearance_settings: true,
      orderSettings: true,
      is_menu_published: true,
      stripe: true,
    },
    with: {
      menu_categories: {
        where: eq(menuCategories.show_on_public_page, true),
        with: {
          items: {
            where: eq(menuItems.show_on_public_page, true),
          },
        },
      },
      popups: true,
    },
  });
  if (!restaurant_record) return restaurant_record;

  const { stripe, ...rest } = restaurant_record;

  const menu_categories = rest.menu_categories.filter((c) => c.items.length > 0);

  const plan = await getRestaurantOwnerPlan(rest.id);

  const orderSettings = hasFeature(plan, "orderSystem")
    ? rest.orderSettings
    : { ...rest.orderSettings, status: "closed" as const };

  const publicStripe = stripe
    ? { configured: stripe.configured ?? false, currency: stripe.currency ?? null }
    : null;

  if (plan === "starter") {
    return { ...rest, menu_categories, orderSettings, stripe: publicStripe, popups: [] };
  }

  return { ...rest, menu_categories, orderSettings, stripe: publicStripe };
};

export type MenuPageRestaurantType = Awaited<ReturnType<typeof getRestaurantWithMenu>>;
