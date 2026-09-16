import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getVenueSeo, venueMetadata, venueNotFoundMetadata } from "../seo";
import MenuPage from "./_components/menu-page";
import { getRestaurantWithMenu } from "./query";
import { MenuUnavailable } from "./_components/menu-unavailable";
import { menuJsonLd } from "./menu-jsonld";
import { breadcrumbJsonLd } from "@/lib/seo";
import { venueUrl } from "@/lib/venue-url";
import { TrackVisit } from "../_components/track-visit";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ step?: string } & Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const venue = await getVenueSeo(slug);
  if (!venue) return venueNotFoundMetadata;

  return venueMetadata(venue, {
    subpath: "/menu",
    title: `Menu · ${venue.name}`,
    description: `Browse the menu at ${venue.name} — dishes, prices and ordering.`,
    noIndex: !venue.is_menu_published,
  });
}
const Page = async ({ params, searchParams }: Props) => {
  const { slug } = await params;
  const query = await searchParams;
  const { step } = query;
  const restaurantRecord = await getRestaurantWithMenu(slug);
  if (!restaurantRecord) return notFound();

  if (!restaurantRecord.is_menu_published) {
    return (
      <MenuUnavailable
        slug={slug}
        name={restaurantRecord.name}
        settings={restaurantRecord.appearance_settings}
      />
    );
  }

  const jsonLd = menuJsonLd({
    slug,
    name: restaurantRecord.name,
    categories: restaurantRecord.menu_categories,
    currency: restaurantRecord.stripe?.currency ?? null,
  });

  return (
    <>
      <TrackVisit slug={slug} event="menu" searchParams={query} />
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: restaurantRecord.name, path: venueUrl(slug) },
              { name: "Menu", path: venueUrl(slug, "/menu") },
            ]),
          ),
        }}
      />
      <MenuPage restaurant={restaurantRecord} initialStep={step} />
    </>
  );
};

export default Page;
