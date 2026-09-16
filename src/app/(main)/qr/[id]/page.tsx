import { db } from "@/drizzle/db";
import { qrCodes } from "@/drizzle/schema";
import { NO_INDEX } from "@/lib/seo";
import { eq } from "drizzle-orm";
import { ArrowUpRight, ExternalLink, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { venueUrl } from "@/lib/venue-url";

export const metadata: Metadata = {
  title: "Leaving Dineri",
  robots: NO_INDEX,
};

type Props = {
  params: Promise<{ id: string }>;
};

const Page = async ({ params }: Props) => {
  const { id } = await params;

  const qr = await db.query.qrCodes.findFirst({
    where: eq(qrCodes.id, id),
    columns: { targetUrl: true, label: true },
    with: { restaurant: { columns: { name: true, slug: true } } },
  });

  if (!qr) return notFound();

  let destination: URL;
  try {
    destination = new URL(qr.targetUrl);
  } catch {
    return notFound();
  }

  if (destination.protocol !== "http:" && destination.protocol !== "https:") {
    return notFound();
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card/60 p-8 text-center backdrop-blur">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning/10 text-warning">
          <ShieldAlert className="h-6 w-6" />
        </div>

        <h1 className="mt-6 text-xl font-semibold">You&apos;re leaving Dineri</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {qr.restaurant?.name ? (
            <>
              This QR code from <span className="text-foreground">{qr.restaurant.name}</span> opens
              an external site.
            </>
          ) : (
            <>This QR code opens an external site.</>
          )}{" "}
          Continue only if you trust it.
        </p>

        <div className="mt-6 flex items-center justify-center gap-2 overflow-hidden rounded-3xl border border-border bg-muted/50 px-4 py-3">
          <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate font-jetbrains-mono text-sm text-foreground">
            {destination.host}
          </span>
        </div>

        <a
          href={destination.toString()}
          rel="noopener noreferrer nofollow external"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]"
        >
          Continue to {destination.host}
          <ArrowUpRight className="h-4 w-4" />
        </a>

        <Link
          href={qr.restaurant?.slug ? venueUrl(qr.restaurant.slug) : "/"}
          className="mt-3 inline-flex w-full items-center justify-center rounded-3xl border border-border bg-card px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          {qr.restaurant?.slug ? "Go to the restaurant page instead" : "Back to home"}
        </Link>
      </div>
    </main>
  );
};

export default Page;
