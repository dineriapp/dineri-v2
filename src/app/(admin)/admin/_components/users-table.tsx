"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { restaurant, subscription } from "@/drizzle/schema";
import { authClient } from "@/lib/auth/client";
import { useAuth } from "@/lib/auth/hooks/use-auth";
import { UserWithRole } from "better-auth/plugins/admin";
import { InferSelectModel } from "drizzle-orm";
import { ArrowUpRight, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { venueUrl } from "@/lib/venue-url";
type RestaurantSummary = Pick<
  InferSelectModel<typeof restaurant>,
  "id" | "name" | "slug" | "ownerId" | "createdAt"
>;
type SubscriptionSummary = InferSelectModel<typeof subscription>;

export type UserRow = {
  user: UserWithRole;
  restaurants: RestaurantSummary[];
  subscriptions: SubscriptionSummary[];
};

const SUBSCRIPTION_STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  active: {
    label: "Active",
    cls: "bg-success/15 text-success border-success/30",
    dot: "bg-success",
  },
  trialing: { label: "Trialing", cls: "bg-info/15 text-info border-info/30", dot: "bg-info" },
  past_due: {
    label: "Past due",
    cls: "bg-warning/15 text-warning border-warning/30",
    dot: "bg-warning",
  },
  canceled: {
    label: "Cancelled",
    cls: "bg-muted/40 text-muted-foreground border-white/10",
    dot: "bg-muted-foreground",
  },
  incomplete: {
    label: "Incomplete",
    cls: "bg-danger/15 text-danger border-danger/30",
    dot: "bg-danger",
  },
  incomplete_expired: {
    label: "Expired",
    cls: "bg-danger/15 text-danger border-danger/30",
    dot: "bg-danger",
  },
  unpaid: { label: "Unpaid", cls: "bg-danger/15 text-danger border-danger/30", dot: "bg-danger" },
};

const subscriptionStatusMeta = (status: string | null) =>
  SUBSCRIPTION_STATUS_META[status ?? ""] ?? {
    label: status ?? "Unknown",
    cls: "bg-muted/40 text-muted-foreground border-white/10",
    dot: "bg-muted-foreground",
  };

const formatDate = (d: Date | string | null) =>
  d
    ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : "-";

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("") || "?";

function RowActions({ userId }: { userId: string }) {
  const { refetchSession: refetch } = useAuth();
  const router = useRouter();

  function handleImpersonateUser() {
    authClient.admin.impersonateUser(
      { userId },
      {
        onError: (error) => void toast.error(error.error.message || "Failed to impersonate"),
        onSuccess: () => {
          refetch();
          router.push("/");
        },
      },
    );
  }

  function handleBanUser() {
    authClient.admin.banUser(
      { userId },
      {
        onError: (error) => void toast.error(error.error.message || "Failed to ban user"),
        onSuccess: () => {
          toast.success("User banned");
          router.refresh();
        },
      },
    );
  }

  function handleUnbanUser() {
    authClient.admin.unbanUser(
      { userId },
      {
        onError: (error) => void toast.error(error.error.message || "Failed to unban user"),
        onSuccess: () => {
          toast.success("User unbanned");
          router.refresh();
        },
      },
    );
  }

  function handleRevokeSessions() {
    authClient.admin.revokeUserSessions(
      { userId },
      {
        onError: (error) =>
          void toast.error(error.error.message || "Failed to revoke user sessions"),
        onSuccess: () => void toast.success("User sessions revoked"),
      },
    );
  }

  function handleRemoveUser() {
    authClient.admin.removeUser(
      { userId },
      {
        onError: (error) => void toast.error(error.error.message || "Failed to delete user"),
        onSuccess: () => {
          toast.success("User deleted");
          router.refresh();
        },
      },
    );
  }

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-background text-muted-foreground hover:border-white/20 hover:text-foreground"
            aria-label="Actions"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleImpersonateUser}>Impersonate</DropdownMenuItem>
          <DropdownMenuItem onClick={handleRevokeSessions}>Revoke sessions</DropdownMenuItem>
          <DropdownMenuItem onClick={handleUnbanUser}>Unban user</DropdownMenuItem>
          <DropdownMenuItem onClick={handleBanUser}>Ban user</DropdownMenuItem>
          <DropdownMenuSeparator />
          <AlertDialogTrigger asChild>
            <DropdownMenuItem variant="destructive">Delete user</DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete user</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this user? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemoveUser}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function UsersTable({ rows, selfId }: { rows: UserRow[]; selfId: string }) {
  return (
    <div className="dash-card overflow-hidden rounded-2xl border border-white/5 bg-surface-1">
      <Table>
        <TableHeader>
          <TableRow className="border-white/5 hover:bg-transparent">
            <TableHead className="h-11 px-4 font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              User
            </TableHead>
            <TableHead className="h-11 px-4 font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Role
            </TableHead>
            <TableHead className="h-11 px-4 font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Restaurants
            </TableHead>
            <TableHead className="h-11 px-4 font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Subscription
            </TableHead>
            <TableHead className="h-11 px-4 font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Joined
            </TableHead>
            <TableHead className="h-11 px-4 text-right font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ user, restaurants, subscriptions }) => {
            const isSelf = user.id === selfId;
            const sub = subscriptions[0];
            const meta = sub ? subscriptionStatusMeta(sub.status) : null;

            return (
              <TableRow key={user.id} className="border-white/5 hover:bg-white/[0.03]">
                {/* User */}
                <TableCell className="min-w-[240px] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-background text-[11px] font-semibold text-muted-foreground">
                      {initials(user.name || user.email)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-sm font-medium">
                          {user.name || "No name"}
                        </span>
                        {user.banned && (
                          <span className="inline-flex items-center rounded-full border border-danger/30 bg-danger/15 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-danger">
                            Banned
                          </span>
                        )}
                        {!user.emailVerified && (
                          <span className="inline-flex items-center rounded-full border border-warning/30 bg-warning/15 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-warning">
                            Unverified
                          </span>
                        )}
                        {isSelf && (
                          <span className="inline-flex items-center rounded-full border border-white/10 bg-background px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                            You
                          </span>
                        )}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                </TableCell>

                {/* Role */}
                <TableCell className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                      user.role === "admin"
                        ? "border-lime/30 bg-lime/15 text-lime"
                        : "border-white/10 bg-background text-muted-foreground"
                    }`}
                  >
                    {user.role ?? "user"}
                  </span>
                </TableCell>

                {/* Restaurants */}
                <TableCell className="px-4 py-3">
                  {restaurants.length === 0 ? (
                    <span className="text-xs text-muted-foreground">&mdash;</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-white/10 bg-background px-1.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                        {restaurants.length}
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={venueUrl(restaurants[0].slug)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 truncate text-xs font-medium hover:text-lime"
                        >
                          {restaurants[0].name}
                          <ArrowUpRight className="h-3 w-3 shrink-0 opacity-60" />
                        </Link>
                        {restaurants.length > 1 && (
                          <span className="ml-1 text-[10px] text-muted-foreground">
                            +{restaurants.length - 1} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </TableCell>

                {/* Subscription */}
                <TableCell className="px-4 py-3">
                  {!sub || !meta ? (
                    <span className="text-xs text-muted-foreground">&mdash;</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium capitalize">{sub.plan}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${meta.cls}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} /> {meta.label}
                      </span>
                    </div>
                  )}
                </TableCell>

                {/* Joined */}
                <TableCell className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                  {formatDate(user.createdAt)}
                </TableCell>

                {/* Actions */}
                <TableCell className="px-4 py-3 text-right">
                  {isSelf ? (
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      &mdash;
                    </span>
                  ) : (
                    <div className="flex justify-end">
                      <RowActions userId={user.id} />
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}

          {rows.length === 0 && (
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableCell
                colSpan={6}
                className="px-4 py-10 text-center text-sm text-muted-foreground"
              >
                No users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
