import { logActivity, SYSTEM_ACTOR } from "@/lib/activity/log";
import { logger } from "@/lib/observability/logger";
import { BATCH_LIMIT, releaseStaleHolds } from "@/lib/services/release-stale-holds";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const released = await releaseStaleHolds();

    for (const booking of released) {
      logActivity({
        restaurantId: booking.restaurantId,
        actor: SYSTEM_ACTOR,
        type: "reservation.status_changed",
        entityId: booking.id,
        data: { guestName: booking.guestName, from: booking.status, to: "cancelled" },
      });
    }

    const hasMore = released.length === BATCH_LIMIT;

    // Logged every run, not only when it acts: "the sweep ran and found
    // nothing" and "the sweep never ran" are the two states the audit could
    // not tell apart from outside.
    logger.info("cron.release_stale_holds", { cancelled: released.length, hasMore });

    return NextResponse.json({
      success: true,
      cancelled: released.length,
      // A full batch means the backlog outlasted this tick; the next run continues.
      hasMore,
    });
  } catch (error) {
    logger.error("cron.release_stale_holds.failed", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
