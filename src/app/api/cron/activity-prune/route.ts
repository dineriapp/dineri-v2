import { pruneActivityEvents } from "@/lib/activity/prune";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Trims the activity feed back to its rolling window (see `ACTIVITY_KEEP_*`).
 *
 * `vercel.json` schedules a plain GET on this path. Vercel reads `CRON_SECRET`
 * from the project's environment variables and, when it is set, attaches
 * `Authorization: Bearer <CRON_SECRET>` to every invocation — nothing needs to
 * be configured on the cron itself. Since the path is publicly routable, the
 * check below is what keeps anyone else from triggering a bulk delete: with
 * `CRON_SECRET` unset the route refuses to run at all, rather than falling open.
 *
 * To run it by hand (locally, or against a deploy):
 *   curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/activity-prune
 */
export async function GET(req: NextRequest) {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { deleted } = await pruneActivityEvents();
        return NextResponse.json({ success: true, deleted });
    } catch (error) {
        console.error("Failed to prune activity events:", error);
        return NextResponse.json(
            { success: false, error: "Failed to prune activity events" },
            { status: 500 }
        );
    }
}
