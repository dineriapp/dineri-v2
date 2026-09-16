import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getActivityVenuesPage, normalizePage } from "@/lib/activity/admin-query";
import { ensureAdminAccess } from "@/lib/auth/guards";
import { timeAgo } from "@/lib/utils";
import { ArrowLeft, ArrowUpRight, Store } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeading, Pagination, SearchForm, type ActivityQuery } from "../_components";

import { venueUrl } from "@/lib/venue-url";
export const dynamic = "force-dynamic";

const BASE = "/admin/site-activities/restaurants";

export default async function ActivityRestaurantsPage({
  searchParams,
}: {
  searchParams: Promise<ActivityQuery>;
}) {
  const admin = await ensureAdminAccess();
  if (!admin.session) redirect("/dashboard");

  const params = await searchParams;
  const query: ActivityQuery = { q: params.q };

  const page = await getActivityVenuesPage({
    page: normalizePage(params.page),
    search: params.q,
  });

  return (
    <div className="animate-fade-in space-y-5 p-4 sm:space-y-6 sm:p-6">
      <Link
        href="/admin/site-activities"
        className="inline-flex items-center gap-1.5 font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        All site activity
      </Link>

      <PageHeading
        icon={Store}
        title="Activity by restaurant"
        badge={`${page.total.toLocaleString()} restaurants`}
        description="Every restaurant on the platform, busiest first. Open one to see only its activity."
        action={
          <SearchForm action={BASE} defaultValue={params.q} placeholder="Search restaurants…" />
        }
      />

      <div className="dash-card overflow-hidden rounded-2xl border border-white/5 bg-surface-1">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="h-11 px-4 font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Restaurant
                </TableHead>
                <TableHead className="h-11 px-4 font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Total events
                </TableHead>
                <TableHead className="h-11 px-4 font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Last 7 days
                </TableHead>
                <TableHead className="h-11 px-4 font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Last activity
                </TableHead>
                <TableHead className="h-11 px-4 text-right font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {page.items.map((venue) => (
                <TableRow key={venue.id} className="border-white/5 hover:bg-white/[0.03]">
                  <TableCell className="min-w-[220px] px-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{venue.name}</div>
                      <Link
                        href={venueUrl(venue.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-jetbrains-mono text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        /{venue.slug}
                        <ArrowUpRight className="h-2.5 w-2.5 shrink-0 opacity-60" />
                      </Link>
                    </div>
                  </TableCell>

                  <TableCell className="px-4 py-3">
                    <span className="font-inter-tight text-sm font-semibold tabular-nums">
                      {venue.total.toLocaleString()}
                    </span>
                  </TableCell>

                  <TableCell className="px-4 py-3">
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {venue.last7d.toLocaleString()}
                    </span>
                  </TableCell>

                  <TableCell className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                    {venue.lastActivityAt ? timeAgo(venue.lastActivityAt.toISOString()) : "—"}
                  </TableCell>

                  <TableCell className="px-4 py-3 text-right">
                    <Link
                      href={`${BASE}/${venue.id}`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-background px-2.5 text-xs text-muted-foreground transition hover:border-lime/30 hover:text-lime"
                    >
                      View activities
                      <ArrowUpRight className="h-3 w-3 shrink-0" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}

              {page.items.length === 0 && (
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableCell
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    No restaurants match that search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Pagination
        base={BASE}
        query={query}
        page={page.page}
        pageCount={page.pageCount}
        total={page.total}
        noun="restaurants"
      />
    </div>
  );
}
