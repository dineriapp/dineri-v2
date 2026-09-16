import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SlugPageClientSide from "./_components/page";
import { TrackVisit } from "./_components/track-visit";
import { getRestaurantWithRelations } from "./query";
import { getVenueSeo, venueJsonLd, venueMetadata, venueNotFoundMetadata } from "./seo";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const venue = await getVenueSeo(slug);
  if (!venue) return venueNotFoundMetadata;
  return venueMetadata(venue);
}

const Page = async ({ params, searchParams }: Props) => {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const [restaurantRecord, venue] = await Promise.all([
    getRestaurantWithRelations(slug),
    getVenueSeo(slug),
  ]);
  if (!restaurantRecord || !venue) return notFound();
  return (
    <>
      <TrackVisit slug={slug} event="pageview" searchParams={query} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(venueJsonLd(venue)) }}
      />
      <SlugPageClientSide restaurant={restaurantRecord} />
    </>
  );
};

export default Page;
