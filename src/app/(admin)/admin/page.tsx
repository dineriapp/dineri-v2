import { db } from "@/drizzle/db";
import { restaurant, subscription } from "@/drizzle/schema";
import { auth } from "@/lib/auth/server";
import { inArray } from "drizzle-orm";
import { Ban, CreditCard, UtensilsCrossed, Users } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { UsersTable, type UserRow } from "./_components/users-table";

const AdminPage = async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session == null) return redirect("/");

  const hasPermissionToViewUsers = await auth.api.userHasPermission({
    body: {
      userId: session.user.id,
      permissions: {
        user: ["list"],
      },
    },
  });

  if (!hasPermissionToViewUsers.success) return redirect("/");

  const users = await auth.api.listUsers({
    headers: await headers(),
    query: { limit: 100, sortBy: "createdAt", sortDirection: "desc" },
  });

  const userIds = users.users.map((u) => u.id);

  const [restaurants, subscriptions] = userIds.length
    ? await Promise.all([
        db.query.restaurant.findMany({
          where: inArray(restaurant.ownerId, userIds),
          columns: { id: true, name: true, slug: true, ownerId: true, createdAt: true },
          orderBy: (r, { desc }) => [desc(r.createdAt)],
        }),
        db.query.subscription.findMany({
          where: inArray(subscription.referenceId, userIds),
        }),
      ])
    : [[], []];

  const restaurantsByOwner = new Map<string, typeof restaurants>();
  for (const r of restaurants) {
    const list = restaurantsByOwner.get(r.ownerId) ?? [];
    list.push(r);
    restaurantsByOwner.set(r.ownerId, list);
  }

  const subscriptionsByReference = new Map<string, typeof subscriptions>();
  for (const s of subscriptions) {
    const list = subscriptionsByReference.get(s.referenceId) ?? [];
    list.push(s);
    subscriptionsByReference.set(s.referenceId, list);
  }

  const activeSubscriptionCount = subscriptions.filter(
    (s) => s.status === "active" || s.status === "trialing",
  ).length;
  const bannedCount = users.users.filter((u) => u.banned).length;

  const rows: UserRow[] = users.users.map((u) => ({
    user: u,
    restaurants: restaurantsByOwner.get(u.id) ?? [],
    subscriptions: subscriptionsByReference.get(u.id) ?? [],
  }));

  return (
    <div className="animate-fade-in space-y-5 p-4 sm:space-y-6 sm:p-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-surface-2 text-lime">
            <Users className="h-4 w-4 shrink-0" />
          </div>
          <h1 className="font-inter-tight min-w-0 text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
            Users
          </h1>
          <span className="ml-1 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-background px-2 py-0.5 font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {users.total} total
          </span>
        </div>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          Every account, restaurant, and subscription on the platform.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="dash-card rounded-2xl border border-white/5 bg-surface-1 p-4">
          <div className="flex items-center justify-between">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-lime/10 text-lime">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-muted-foreground">Total users</div>
          <div className="font-inter-tight mt-0.5 text-xl font-semibold tabular-nums">
            {users.total}
          </div>
        </div>
        <div className="dash-card rounded-2xl border border-white/5 bg-surface-1 p-4">
          <div className="flex items-center justify-between">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-background text-muted-foreground">
              <UtensilsCrossed className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-muted-foreground">Restaurants</div>
          <div className="font-inter-tight mt-0.5 text-xl font-semibold tabular-nums">
            {restaurants.length}
          </div>
        </div>
        <div className="dash-card rounded-2xl border border-white/5 bg-surface-1 p-4">
          <div className="flex items-center justify-between">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-lime/10 text-lime">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-muted-foreground">Active subscriptions</div>
          <div className="font-inter-tight mt-0.5 text-xl font-semibold tabular-nums">
            {activeSubscriptionCount}
          </div>
        </div>
        <div className="dash-card rounded-2xl border border-white/5 bg-surface-1 p-4">
          <div className="flex items-center justify-between">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-background text-muted-foreground">
              <Ban className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-muted-foreground">Banned users</div>
          <div className="font-inter-tight mt-0.5 text-xl font-semibold tabular-nums">
            {bannedCount}
          </div>
        </div>
      </div>

      {/* Users table */}
      <UsersTable rows={rows} selfId={session.user.id} />
    </div>
  );
};

export default AdminPage;
