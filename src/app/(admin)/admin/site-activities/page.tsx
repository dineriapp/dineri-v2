import {
  getSiteActivityPage,
  getSiteActivityStats,
  normalizePage,
} from "@/lib/activity/admin-query";
import { ensureAdminAccess } from "@/lib/auth/guards";
import { Activity, Clock, Store, TrendingUp, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ActivityTable,
  GroupFilter,
  PageHeading,
  Pagination,
  SearchForm,
  StatTile,
  parseGroup,
  type ActivityQuery,
} from "./_components";

export const dynamic = "force-dynamic";

const BASE = "/admin/site-activities";

export default async function SiteActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<ActivityQuery>;
}) {
  // Asserted here rather than inherited from the layout: a layout guard does
  // not stop this page's queries from running, and every admin page is one
  // refactor away from being rendered outside that layout.
  const admin = await ensureAdminAccess();
  if (!admin.session) redirect("/dashboard");

  const params = await searchParams;
  const group = parseGroup(params.group);
  const query: ActivityQuery = { q: params.q, group };

  const [stats, page] = await Promise.all([
    getSiteActivityStats(),
    getSiteActivityPage({
      page: normalizePage(params.page),
      group,
      search: params.q,
    }),
  ]);

  return (
    <div className="animate-fade-in space-y-5 p-4 sm:space-y-6 sm:p-6">
      <PageHeading
        icon={Activity}
        title="Site activities"
        badge={`${stats.total.toLocaleString()} events`}
        description="Everything happening across every restaurant on the platform — orders, bookings, menu edits and settings changes, newest first."
        action={
          <Link
            href={`${BASE}/restaurants`}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-surface-1 px-3 text-xs font-medium transition hover:border-lime/30 hover:text-lime"
          >
            <Store className="h-3.5 w-3.5" />
            See by restaurant
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={Activity} label="Total events" value={stats.total} tone="lime" />
        <StatTile icon={Clock} label="Last 24 hours" value={stats.last24h} />
        <StatTile icon={TrendingUp} label="Last 7 days" value={stats.last7d} />
        <StatTile icon={UtensilsCrossed} label="Active restaurants" value={stats.activeVenues} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <GroupFilter base={BASE} query={query} active={group} />
        <SearchForm
          action={BASE}
          defaultValue={params.q}
          placeholder="Search restaurant or actor…"
          hidden={{ group }}
        />
      </div>

      <ActivityTable entries={page.items} />

      <Pagination
        base={BASE}
        query={query}
        page={page.page}
        pageCount={page.pageCount}
        total={page.total}
        noun="events"
      />
    </div>
  );
}
