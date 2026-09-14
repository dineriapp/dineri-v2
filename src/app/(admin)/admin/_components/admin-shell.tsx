"use client";

import { authClient } from "@/lib/auth/client";
import { clearSelectedRestaurant } from "@/stores/restaurant-store";
import { cn } from "@/lib/utils";
import {
  Activity,
  ArrowUpRight,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/shared/brand-logo";

type AdminUser = { name?: string | null; email: string };

const NAV = [
  { title: "Users", url: "/admin", icon: Users, exact: true },
  { title: "Site activities", url: "/admin/site-activities", icon: Activity, exact: false },
];

const SHORTCUTS = [
  { title: "Merchant dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "View live site", url: "/", icon: ArrowUpRight },
];

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("") || "?";

function SidebarBody({
  pathname,
  user,
  onNavigate,
}: {
  pathname: string;
  user: AdminUser;
  onNavigate?: () => void;
}) {
  const router = useRouter();

  async function handleSignOut() {
    try {
      clearSelectedRestaurant();
      await authClient.signOut();
      router.push("/");
    } catch {
      toast.error("Failed to sign out");
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5">
        <BrandLogo className="h-8" />
        <div className="font-jetbrains-mono text-[9px] uppercase tracking-[0.2em] text-lime">
          Admin
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
        <div>
          <div className="px-2 pb-2 font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Platform
          </div>
          <ul className="space-y-1">
            {NAV.map((item) => {
              const active = item.exact
                ? pathname === item.url
                : pathname === item.url || pathname.startsWith(`${item.url}/`);
              const Icon = item.icon;
              return (
                <li key={item.url}>
                  <Link
                    href={item.url}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-3 py-2 text-sm font-medium transition",
                      active
                        ? "border-lime/20 bg-lime/15 text-lime"
                        : "border-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" /> {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <div className="px-2 pb-2 font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Shortcuts
          </div>
          <ul className="space-y-1">
            {SHORTCUTS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.url}>
                  <Link
                    href={item.url}
                    onClick={onNavigate}
                    className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
                  >
                    <Icon className="h-4 w-4 shrink-0" /> {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-white/5 p-3">
        <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-surface-2 px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-background text-[11px] font-semibold text-muted-foreground">
            {initials(user.name || user.email)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold">{user.name || "Admin"}</div>
            <div className="truncate text-[10px] text-muted-foreground">{user.email}</div>
          </div>
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-background text-muted-foreground hover:border-white/20 hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminShell({ user, children }: { user: AdminUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-white/5 bg-surface-1 lg:block">
        <SidebarBody pathname={pathname} user={user} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] border-r border-white/5 bg-surface-1">
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-background text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarBody pathname={pathname} user={user} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-white/5 bg-surface-1/80 px-4 backdrop-blur sm:px-6">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-background text-muted-foreground lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-lime" />
            <span className="font-jetbrains-mono text-xs uppercase tracking-wider text-muted-foreground">
              Platform admin
            </span>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
