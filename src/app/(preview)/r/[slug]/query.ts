import { db } from "@/drizzle/db";
import {
  events,
  faqCategories,
  faqs,
  menuCategories,
  menuItems,
  restaurant,
} from "@/drizzle/schema";
import { fetchGooglePlaceRating } from "@/lib/google/places";
import { filterPublicEvents } from "@/lib/services/event-visibility";
import { getRestaurantOwnerPlan } from "@/lib/stripe/get-restaurant-owner-plan";
import { eq } from "drizzle-orm";

export const getRestaurantWithRelations = async (slug: string) => {
  const restaurant_record = await db.query.restaurant.findFirst({
    where: eq(restaurant.slug, slug),
    columns: {
      id: true,
      name: true,
      slug: true,
      bio: true,
      tagline: true,
      logo: true,
      address: true,
      phone: true,
      website: true,
      timezone: true,
      opening_hours: true,
      appearance_settings: true,
      orderSettings: true,
      reservation_settings: true,
      is_menu_published: true,
      instagram: true,
      facebook: true,
      tiktok: true,
      x_twitter: true,
      youtube: true,
      linkedin: true,
      whatsapp: true,
      googlePlaceId: true,
      stripe: true,
    },
    with: {
      events: {
        where: eq(events.active, true),
      },
      faq_categories: {
        where: eq(faqCategories.active, true),
        with: {
          items: {
            where: eq(faqs.active, true),
          },
        },
      },
      links: true,
      menu_categories: {
        where: eq(menuCategories.show_on_public_page, true),
        with: {
          items: {
            where: eq(menuItems.show_on_public_page, true),
          },
        },
      },
      restaurantGallery: true,
      successStories: true,
      popups: true,
    },
  });
  if (!restaurant_record) return restaurant_record;

  const { googlePlaceId, stripe, ...rest } = restaurant_record;

  rest.events = filterPublicEvents(rest.events, rest.timezone);

  rest.faq_categories = rest.faq_categories.filter((c) => c.items.length > 0);

  const googleRating = googlePlaceId ? await fetchGooglePlaceRating(googlePlaceId) : null;

  const publicStripe = stripe ? { currency: stripe.currency ?? null } : null;

  const plan = await getRestaurantOwnerPlan(rest.id);
  if (plan === "starter") {
    return { ...rest, stripe: publicStripe, popups: [], googleRating };
  }

  return { ...rest, stripe: publicStripe, googleRating };
};

export type SlugPageRestaurantType = Awaited<ReturnType<typeof getRestaurantWithRelations>>;
