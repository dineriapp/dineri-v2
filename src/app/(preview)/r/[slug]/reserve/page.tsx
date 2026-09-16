import { getOnlineReservationsStatus } from "@/lib/services/reservation-online-availability";
import { restaurantHasFeature } from "@/lib/services/restaurant-plan";
import { DEFAULT_APPEARANCE } from "@/lib/types/appearnace";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getVenueSeo, venueMetadata, venueNotFoundMetadata } from "../seo";
import ReservePage from "./_components/reserve-page";
import { ReservationUnavailable } from "./_components/reservation-unavailable";
import { getRestaurantForReservationPage } from "./query";
import { breadcrumbJsonLd } from "@/lib/seo";
import { venueUrl } from "@/lib/venue-url";
import { TrackVisit } from "../_components/track-visit";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const venue = await getVenueSeo(slug);
  if (!venue) return venueNotFoundMetadata;

  const onlineStatus = getOnlineReservationsStatus(venue.reservation_settings);

  return venueMetadata(venue, {
    subpath: "/reserve",
    title: `Book a table at ${venue.name}`,
    description: `Reserve a table at ${venue.name} — pick a date, time and party size in seconds.`,
    noIndex: !onlineStatus.available,
  });
}

const Page = async ({ params, searchParams }: Props) => {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const restaurantRecord = await getRestaurantForReservationPage(slug);
  if (!restaurantRecord) return notFound();

  const onPlan = await restaurantHasFeature(restaurantRecord.id, "reservations");
  const onlineStatus = getOnlineReservationsStatus(restaurantRecord.reservation_settings);

  if (!onPlan || !onlineStatus.available) {
    return (
      <ReservationUnavailable
        slug={slug}
        name={restaurantRecord.name}
        settings={restaurantRecord.appearance_settings ?? DEFAULT_APPEARANCE}
        reason={onPlan ? onlineStatus.reason! : "NOT_ON_PLAN"}
      />
    );
  }

  return (
    <>
      <TrackVisit slug={slug} event="reserve" searchParams={query} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: restaurantRecord.name, path: venueUrl(slug) },
              { name: "Book a table", path: venueUrl(slug, "/reserve") },
            ]),
          ),
        }}
      />
      <ReservePage restaurant={restaurantRecord} slug={slug} />
    </>
  );
};

export default Page;
