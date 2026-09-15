import { db } from "@/drizzle/db";
import { getOnlineReservationsStatus } from "@/lib/services/reservation-online-availability";
import { absoluteUrl } from "@/lib/seo";
import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";

const MARKETING_PATHS: Array<{ path: string; priority: number; changeFrequency: "monthly" }> = [
  { path: "/", priority: 1, changeFrequency: "monthly" },
  { path: "/features", priority: 0.8, changeFrequency: "monthly" },
  { path: "/pricing", priority: 0.8, changeFrequency: "monthly" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.5, changeFrequency: "monthly" },
  { path: "/help", priority: 0.5, changeFrequency: "monthly" },
  { path: "/docs", priority: 0.5, changeFrequency: "monthly" },
  { path: "/demo", priority: 0.5, changeFrequency: "monthly" },
  { path: "/careers", priority: 0.3, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.3, changeFrequency: "monthly" },
  { path: "/cookies", priority: 0.3, changeFrequency: "monthly" },
];

export const dynamic = "force-dynamic";

const MAX_VENUES = 15_000;

const REVALIDATE_SECONDS = 3600;

const listVenues = unstable_cache(
  () =>
    db.query.restaurant.findMany({
      columns: {
        slug: true,
        updatedAt: true,
        is_menu_published: true,
        reservation_settings: true,
      },
      orderBy: (r, { desc }) => desc(r.updatedAt),
      limit: MAX_VENUES,
    }),
  ["sitemap-venues"],
  { revalidate: REVALIDATE_SECONDS },
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const deployedAt = new Date();

  const marketing: MetadataRoute.Sitemap = MARKETING_PATHS.map(
    ({ path, priority, changeFrequency }) => ({
      url: absoluteUrl(path),
      lastModified: deployedAt,
      changeFrequency,
      priority,
    }),
  );

  const venues = await listVenues();

  const venuePages: MetadataRoute.Sitemap = venues.flatMap((venue) => {
    const entries: MetadataRoute.Sitemap = [
      {
        url: absoluteUrl(`/r/${venue.slug}`),
        lastModified: venue.updatedAt,
        changeFrequency: "weekly",
        priority: 0.9,
      },
    ];

    if (venue.is_menu_published) {
      entries.push({
        url: absoluteUrl(`/r/${venue.slug}/menu`),
        lastModified: venue.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    if (getOnlineReservationsStatus(venue.reservation_settings).available) {
      entries.push({
        url: absoluteUrl(`/r/${venue.slug}/reserve`),
        lastModified: venue.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    return entries;
  });

  return [...marketing, ...venuePages];
}
