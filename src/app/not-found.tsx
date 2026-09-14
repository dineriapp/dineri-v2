"use client";
import { ArrowLeft, Compass, Home, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NotFound = () => {
    const pathname = usePathname()
    return (
        <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
            {/* Decorative background */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-pulse" />
                <div className="absolute top-1/2 -right-32 h-112 w-md rounded-full bg-info/20 blur-3xl animate-pulse [animation-delay:1s]" />
                <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-accent/30 blur-3xl animate-pulse [animation-delay:2s]" />
                <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage:
                            "linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)",
                        backgroundSize: "48px 48px",
                    }}
                />
            </div>

            <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-16 text-center">
                {/* Tag */}
                <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-warning" />
                    </span>
                    Error 404 · Page not found
                </span>

                {/* Big 404 */}
                <h1 className="relative select-none font-bold leading-none tracking-tighter">
                    <span className="block bg-linear-to-br from-primary via-foreground to-info bg-clip-text text-[8rem] text-transparent sm:text-[12rem] md:text-[16rem]">
                        404
                    </span>
                    <Compass
                        className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-primary/40 sm:h-24 sm:w-24 md:h-32 md:w-32"
                        style={{ animation: "spin 8s linear infinite" }}
                    />
                </h1>

                <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">
                    Looks like you&apos;ve wandered off the map
                </h2>
                <p className="mt-3 max-w-lg text-base text-muted-foreground sm:text-lg">
                    The page you&apos;re looking for doesn&apos;t exist, was moved, or is taking a coffee break. Let&apos;s get
                    you back on track.
                </p>

                {/* Path display */}
                <div className="mt-6 inline-flex max-w-full items-center gap-2 truncate rounded-3xl border border-border bg-muted/50 px-3 py-1.5 font-jetbrains-mono text-xs text-muted-foreground">
                    <Search className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{pathname}</span>
                </div>

                {/* Actions */}
                <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-3xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] hover:shadow-primary/40"
                    >
                        <Home className="h-4 w-4" />
                        Back to home
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-2 rounded-3xl border border-border bg-card px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Go back
                    </button>
                </div>

                {/* Quick links */}
                <div className="mt-12 w-full max-w-2xl">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Or explore these pages
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                            { to: "/features", label: "Features" },
                            { to: "/pricing", label: "Pricing" },
                            { to: "/docs", label: "Docs" },
                            { to: "/help", label: "Help" },
                        ].map((l) => (
                            <Link
                                key={l.to}
                                href={l.to}
                                className="rounded-3xl border border-border bg-card/60 px-4 py-3 text-sm font-medium text-foreground backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary"
                            >
                                {l.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default NotFound;
