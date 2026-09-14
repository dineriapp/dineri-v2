import "server-only";

import { db } from "@/drizzle/db";
import { sql } from "drizzle-orm";
import { ACTIVITY_KEEP_DAYS, ACTIVITY_KEEP_PER_RESTAURANT } from "./definitions";

export async function pruneActivityEvents(): Promise<{ deleted: number }> {
    const result = await db.execute(sql`
        DELETE FROM activity_events ae
        USING (
            SELECT id
            FROM (
                SELECT
                    id,
                    created_at,
                    row_number() OVER (
                        PARTITION BY restaurant_id ORDER BY created_at DESC
                    ) AS rn
                FROM activity_events
            ) ranked
            WHERE ranked.rn > ${ACTIVITY_KEEP_PER_RESTAURANT}
               OR ranked.created_at < now() - ${sql.raw(`interval '${ACTIVITY_KEEP_DAYS} days'`)}
        ) stale
        WHERE ae.id = stale.id
    `);

    return { deleted: result.rowCount ?? 0 };
}
