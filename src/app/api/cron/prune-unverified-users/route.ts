import { logger } from "@/lib/observability/logger";
import { BATCH_LIMIT, pruneUnverifiedUsers } from "@/lib/services/prune-unverified-users";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { deleted } = await pruneUnverifiedUsers();
    const hasMore = deleted === BATCH_LIMIT;

    logger.info("cron.prune_unverified_users", { deleted, hasMore });

    return NextResponse.json({ success: true, deleted, hasMore });
  } catch (error) {
    logger.error("cron.prune_unverified_users.failed", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
