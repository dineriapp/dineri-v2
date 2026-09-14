"use client";

import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { logger } from "@/lib/observability/logger";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("boundary.dashboard", error, { digest: error.digest });
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center text-foreground">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This screen failed to load. Your data is safe — nothing was saved or changed by this
          error.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-3xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-3xl border border-border bg-card px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </div>

        {error.digest && (
          <p className="mt-6 font-jetbrains-mono text-xs text-muted-foreground">
            Reference: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
