import { NO_INDEX } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getVenueSeo } from "../seo";
import TrackOrderForm from "./_components/track-order-form";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const venue = await getVenueSeo(slug);
  if (!venue) return { robots: NO_INDEX };

  return {
    title: `Track your order · ${venue.name}`,
    description: `Look up an order you placed at ${venue.name}.`,
    robots: NO_INDEX,
  };
}

const Page = async ({ params }: Props) => {
  const { slug } = await params;
  const venue = await getVenueSeo(slug);
  if (!venue) return notFound();

  return <TrackOrderForm slug={slug} restaurantName={venue.name} />;
};

export default Page;
