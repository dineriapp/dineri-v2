"use client";

import { RefreshCw } from "lucide-react";
import { logger } from "@/lib/observability/logger";
import { useEffect } from "react";

export default function PreviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("boundary.public_venue", error, { digest: error.digest });
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center text-foreground">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold">This page didn&apos;t load</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Something went wrong on our end. The restaurant is fine — this is us. Please try again in
          a moment.
        </p>

        <button
          onClick={reset}
          className="mt-8 inline-flex items-center gap-2 rounded-3xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>

        {error.digest && (
          <p className="mt-6 font-jetbrains-mono text-xs text-muted-foreground">
            Reference: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
