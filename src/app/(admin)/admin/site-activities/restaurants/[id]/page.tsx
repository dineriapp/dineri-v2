import {
  getSiteActivityPage,
  getSiteActivityStats,
  getVenue,
  normalizePage,
} from "@/lib/activity/admin-query";
import { ensureAdminAccess } from "@/lib/auth/guards";
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  Clock,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ActivityTable,
  GroupFilter,
  PageHeading,
  Pagination,
  StatTile,
  parseGroup,
  type ActivityQuery,
} from "../../_components";

export const dynamic = "force-dynamic";

export default async function VenueActivitiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<ActivityQuery>;
}) {
  const admin = await ensureAdminAccess();
  if (!admin.session) redirect("/dashboard");

  const [{ id }, search] = await Promise.all([params, searchParams]);

  const venue = await getVenue(id);
  if (!venue) notFound();

  const base = `/admin/site-activities/restaurants/${venue.id}`;
  const group = parseGroup(search.group);
  const query: ActivityQuery = { group };

  const [stats, page] = await Promise.all([
    getSiteActivityStats(venue.id),
    getSiteActivityPage({
      page: normalizePage(search.page),
      restaurantId: venue.id,
      group,
    }),
  ]);

  return (
    <div className="animate-fade-in space-y-5 p-4 sm:space-y-6 sm:p-6">
      <Link
        href="/admin/site-activities/restaurants"
        className="inline-flex items-center gap-1.5 font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        All restaurants
      </Link>

      <PageHeading
        icon={UtensilsCrossed}
        title={venue.name}
        badge={`${stats.total.toLocaleString()} events`}
        description="Everything this restaurant has done, newest first."
        action={
          <Link
            href={`/r/${venue.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-surface-1 px-3 text-xs font-medium transition hover:border-lime/30 hover:text-lime"
          >
            /{venue.slug}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <StatTile icon={Activity} label="Total events" value={stats.total} tone="lime" />
        <StatTile icon={Clock} label="Last 24 hours" value={stats.last24h} />
        <StatTile icon={TrendingUp} label="Last 7 days" value={stats.last7d} />
      </div>

      <GroupFilter base={base} query={query} active={group} />

      <ActivityTable entries={page.items} showVenue={false} />

      <Pagination
        base={base}
        query={query}
        page={page.page}
        pageCount={page.pageCount}
        total={page.total}
        noun="events"
      />
    </div>
  );
}
