import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SlugPageClientSide from "./_components/page";
import { getRestaurantWithRelations } from "./query";
import { getVenueSeo, venueJsonLd, venueMetadata, venueNotFoundMetadata } from "./seo";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const venue = await getVenueSeo(slug);
  if (!venue) return venueNotFoundMetadata;
  return venueMetadata(venue);
}

const Page = async ({ params }: Props) => {
  const { slug } = await params;
  const [restaurantRecord, venue] = await Promise.all([
    getRestaurantWithRelations(slug),
    getVenueSeo(slug),
  ]);
  if (!restaurantRecord || !venue) return notFound();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(venueJsonLd(venue)) }}
      />
      <SlugPageClientSide restaurant={restaurantRecord} />
    </>
  );
};

export default Page;
