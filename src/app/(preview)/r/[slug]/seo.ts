import "server-only";

import { db } from "@/drizzle/db";
import { restaurant } from "@/drizzle/schema";
import { SITE_NAME, truncate } from "@/lib/seo";
import { venueUrl } from "@/lib/venue-url";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { cache } from "react";

export const getVenueSeo = cache(async (slug: string) => {
  return db.query.restaurant.findFirst({
    where: eq(restaurant.slug, slug),
    columns: {
      name: true,
      slug: true,
      bio: true,
      tagline: true,
      logo: true,
      address: true,
      city: true,
      phone: true,
      website: true,
      cuisine: true,
      opening_hours: true,
      appearance_settings: true,
      reservation_settings: true,
      is_menu_published: true,
      instagram: true,
      facebook: true,
      tiktok: true,
      x_twitter: true,
      youtube: true,
      linkedin: true,
    },
  });
});

export type VenueSeo = NonNullable<Awaited<ReturnType<typeof getVenueSeo>>>;

function venueImage(venue: VenueSeo): string | null {
  return venue.appearance_settings?.cover_image || venue.logo?.url || null;
}

function venueDescription(venue: VenueSeo): string {
  const written = venue.tagline?.trim() || venue.bio?.trim();
  if (written) return truncate(written);

  const where = venue.city?.trim();
  return truncate(
    `Menu, opening hours and bookings for ${venue.name}${where ? ` in ${where}` : ""}.`,
  );
}

type VenuePageMetadata = {
  subpath?: string;
  title?: string;
  description?: string;
  noIndex?: boolean;
};

export function venueMetadata(venue: VenueSeo, options: VenuePageMetadata = {}): Metadata {
  // Absolute: a relative canonical would resolve against metadataBase - the
  // platform host - and point Google at a redirect.
  const url = venueUrl(venue.slug, options.subpath);
  const title = options.title ?? venue.name;
  const description = options.description ?? venueDescription(venue);
  const image = venueImage(venue);

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: options.noIndex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      siteName: venue.name,
      title,
      description,
      url,
      images: image ? [{ url: image, alt: venue.name }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export const venueNotFoundMetadata: Metadata = {
  title: `Restaurant not found · ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

const SCHEMA_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function openingHoursSpecification(venue: VenueSeo) {
  return Object.entries(venue.opening_hours ?? {})
    .filter(
      ([day, hours]) =>
        SCHEMA_DAYS[Number(day)] && hours?.isOpen && hours.openTime && hours.closeTime,
    )
    .map(([day, hours]) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${SCHEMA_DAYS[Number(day)]}`,
      opens: hours.openTime,
      closes: hours.closeTime,
    }));
}

export function venueJsonLd(venue: VenueSeo): Record<string, unknown> {
  const url = venueUrl(venue.slug);
  const image = venueImage(venue);
  const socials = [
    venue.instagram,
    venue.facebook,
    venue.tiktok,
    venue.x_twitter,
    venue.youtube,
    venue.linkedin,
    venue.website,
  ].filter((link): link is string => !!link?.trim());

  const hours = openingHoursSpecification(venue);
  const acceptsReservations =
    venue.reservation_settings?.acceptingReservations === true &&
    venue.reservation_settings?.emergencyStop !== true;

  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${url}#restaurant`,
    name: venue.name,
    description: venueDescription(venue),
    url,
    ...(image ? { image } : {}),
    ...(venue.logo?.url ? { logo: venue.logo.url } : {}),
    ...(venue.phone ? { telephone: venue.phone } : {}),
    ...(venue.cuisine ? { servesCuisine: venue.cuisine } : {}),
    ...(venue.address || venue.city
      ? {
          address: {
            "@type": "PostalAddress",
            ...(venue.address ? { streetAddress: venue.address } : {}),
            ...(venue.city ? { addressLocality: venue.city } : {}),
          },
        }
      : {}),
    ...(hours.length > 0 ? { openingHoursSpecification: hours } : {}),
    ...(socials.length > 0 ? { sameAs: socials } : {}),
    ...(venue.is_menu_published ? { hasMenu: venueUrl(venue.slug, "/menu") } : {}),
    acceptsReservations,
  };
}
