"use client";

import { logger } from "@/lib/observability/logger";
import { useEffect } from "react";
import "./globals.css";
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("boundary.global", error, { digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
          <h1 className="text-2xl font-semibold sm:text-3xl">Something went wrong</h1>
          <p className="mt-3 text-base text-muted-foreground">
            We hit an unexpected error. Trying again usually works — if it doesn&apos;t, please come
            back in a few minutes.
          </p>

          {error.digest && (
            <p className="mt-6 rounded-3xl border border-border bg-muted/50 px-3 py-1.5 font-jetbrains-mono text-xs text-muted-foreground">
              Reference: {error.digest}
            </p>
          )}

          <button
            onClick={reset}
            className="mt-8 inline-flex items-center gap-2 rounded-3xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
