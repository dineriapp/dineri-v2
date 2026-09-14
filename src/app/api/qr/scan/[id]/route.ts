import { db } from "@/drizzle/db";
import { qrCodes } from "@/drizzle/schema";
import { QR_TAGS, withUtm } from "@/lib/analytics/utm";
import { limitApi } from "@/lib/rate-limit/guard";
import { RATE_LIMIT_MESSAGE, rateLimitHeaders } from "@/lib/rate-limit/http";
import { siteUrl } from "@/lib/seo";
import { bumpQRCodeScanCount } from "@/lib/server/func/qr-scans";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

function isSameOrigin(target: URL): boolean {
  try {
    return target.origin === new URL(siteUrl()).origin;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const limit = await limitApi("qr-scan", "qrScan", req.headers);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: RATE_LIMIT_MESSAGE },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  try {
    const qr = await db.query.qrCodes.findFirst({
      where: eq(qrCodes.id, id),
    });

    if (!qr) {
      return NextResponse.json({ error: "QR code not found" }, { status: 404 });
    }

    const targetUrl = qr.targetUrl;

    let url: URL;

    try {
      url = new URL(targetUrl);
    } catch {
      return NextResponse.json({ error: "Invalid QR code destination" }, { status: 400 });
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return NextResponse.json({ error: "Invalid QR code destination" }, { status: 400 });
    }

    Promise.resolve().then(async () => {
      try {
        await bumpQRCodeScanCount(id);
      } catch (err) {
        console.error("Failed to increment scans:", err);
      }
    });

    if (isSameOrigin(url)) {
      return NextResponse.redirect(withUtm(url.toString(), QR_TAGS), 302);
    }

    return NextResponse.redirect(new URL(`/qr/${id}`, siteUrl()).toString(), 302);
  } catch (error) {
    console.error("QR scan error:", error);

    return NextResponse.json({ error: "Failed to process QR code scan" }, { status: 500 });
  }
}
