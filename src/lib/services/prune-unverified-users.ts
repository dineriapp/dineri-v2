import "server-only";

import { db } from "@/drizzle/db";
import { sql } from "drizzle-orm";

export const BATCH_LIMIT = 500;

export const UNVERIFIED_TTL_HOURS = 72;

type Executor = Pick<typeof db, "execute">;

export async function pruneUnverifiedUsers(
  executor: Executor = db,
  limit: number = BATCH_LIMIT,
): Promise<{ deleted: number }> {
  const result = await executor.execute<{ id: string }>(sql`
    with stale as (
      select u.id
      from "user" u
      where u.email_verified = false
        and u.role <> 'admin'
        and u.created_at < now() - (${UNVERIFIED_TTL_HOURS} * interval '1 hour')
        and not exists (select 1 from restaurant r where r.owner_id = u.id)
      order by u.created_at
      limit ${limit}
    )
    delete from "user" u
    using stale s
    where u.id = s.id
      -- Re-checked against the newest row version so a user verifying
      -- mid-sweep is kept.
      and u.email_verified = false
    returning u.id
  `);

  return { deleted: result.rows.length };
}
