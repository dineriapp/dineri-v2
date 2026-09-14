"use client";
import { SlugPageRestaurantType } from "../query";
import { PreviewSection } from "@/app/(dashboard)/dashboard/(with-sidebar)/appearance/_components/preview-section";
import { DEFAULT_APPEARANCE } from "@/lib/types/appearnace";

const SlugPageClientSide = ({ restaurant }: { restaurant: SlugPageRestaurantType }) => {
  if (!restaurant) return null;
  return (
    <PreviewSection
      settings={restaurant?.appearance_settings ?? DEFAULT_APPEARANCE}
      restaurant={restaurant}
      branding={{
        bio: restaurant?.bio ?? "",
        name: restaurant?.name ?? "",
        tagline: restaurant?.tagline ?? "",
        image: restaurant?.logo?.url ?? "",
      }}
      links={restaurant?.links}
      isSlugPage={true}
      isLoading={false}
      events={restaurant.events}
      faqs={restaurant.faq_categories}
      successStories={restaurant.successStories}
      galleryItems={restaurant.restaurantGallery}
      menu={restaurant.menu_categories}
      popups={restaurant.popups}
      googleRating={restaurant.googleRating}
    />
  );
};

export default SlugPageClientSide;
