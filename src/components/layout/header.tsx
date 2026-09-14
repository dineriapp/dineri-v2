"use client";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PillButton } from "@/components/ui/ui-kit/PillButton";
import { authClient } from "@/lib/auth/client";
import { useAuth } from "@/lib/auth/hooks/use-auth";
import { cn } from "@/lib/utils";
import { clearSelectedRestaurant } from "@/stores/restaurant-store";
import { Menu } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
const links = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
  { label: "About", href: "/about" },
  { label: "Demo", href: "/demo" },
];

export const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300 px-4",
        scrolled
          ? "border-b border-foreground/5 bg-background/80 backdrop-blur-xl"
          : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-304 items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center" aria-label="Dineri home">
            <BrandLogo className="h-7" priority />
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className={cn(
                  "text-sm transition-colors hover:text-foreground text-muted-foreground",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user?.email ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-foreground/10 hover:border-foreground/20 transition-colors cursor-pointer">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user?.image ?? ""} alt={user?.name ?? ""} />
                      <AvatarFallback className="text-xs font-medium bg-lime/20 text-foreground">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      clearSelectedRestaurant();
                      authClient.signOut();
                    }}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link
                href={"/sign-in"}
                className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
              >
                Sign in
              </Link>
              <Link href={"/sign-up"} className="hidden sm:inline-flex">
                <PillButton size="sm">Start free →</PillButton>
              </Link>
            </>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <button
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-foreground/10 md:hidden cursor-pointer"
                aria-label="Toggle menu"
              >
                <Menu className="h-4 w-4" />
              </button>
            </SheetTrigger>

            <SheetContent
              side="left"
              className="md:hidden bg-background gap-0! border-r border-r-foreground/20 w-70"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>

              {/* 🔥 Logo */}
              <div className="flex items-center px-4 py-4 border-b border-foreground/5">
                <BrandLogo className="h-7" />
              </div>

              {/* 🔗 Links */}
              <nav className="flex flex-col gap-1 px-4 py-4">
                {links.map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    className="rounded-full px-2 py-2.5 text-sm text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                ))}

                {!user && (
                  <>
                    <Link
                      href={"/sign-in"}
                      className="rounded-full px-2 py-2.5 text-sm text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                    >
                      Sign in
                    </Link>

                    <Link href={"/sign-up"} className="mt-3">
                      <PillButton size="md" className="w-full">
                        Start free →
                      </PillButton>
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
