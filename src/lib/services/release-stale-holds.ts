import "server-only";

import { db } from "@/drizzle/db";
import type { ReservationStatus } from "@/drizzle/schemas/reservation-schema";
import { sql } from "drizzle-orm";
import { HOLD_BOUNDS } from "./reservation-hold";

export const BATCH_LIMIT = 500;

export type ReleasedHold = {
  id: string;
  status: ReservationStatus;
  guestName: string;
  restaurantId: string;
};

type Executor = Pick<typeof db, "execute">;

export async function releaseStaleHolds(
  executor: Executor = db,
  limit: number = BATCH_LIMIT,
): Promise<ReleasedHold[]> {
  const { defaultMinutes, minMinutes, maxMinutes, graceMinutes } = HOLD_BOUNDS;

  const holdMinutes = sql`
    greatest(
      least(
        case
          when rest.reservation_settings->>'autoReleaseMinutes' ~ '^[0-9]+$'
            then (rest.reservation_settings->>'autoReleaseMinutes')::int
          else ${defaultMinutes}
        end,
        ${maxMinutes}
      ),
      ${minMinutes}
    )
  `;

  const result = await executor.execute<ReleasedHold>(sql`
    with stale as (
      select r.id, r.status, r.guest_name, r.restaurant_id
      from reservations r
      join restaurant rest on rest.id = r.restaurant_id
      where r.payment_status = 'pending'
        and r.status in ('pending', 'confirmed')
        and r.created_at < now() - ((${holdMinutes} + ${graceMinutes}) * interval '1 minute')
      order by r.created_at
      limit ${limit}
    ),
    released as (
      update reservations r
      set status = 'cancelled',
          payment_status = 'failed',
          updated_at = now()
      from stale s
      where r.id = s.id
        -- Re-checked against the newest committed row version: a deposit
        -- landing mid-sweep drops the row out rather than being cancelled
        -- after the guest has paid.
        and r.payment_status = 'pending'
        and r.status in ('pending', 'confirmed')
      returning r.id
    )
    select s.id,
           s.status,
           s.guest_name as "guestName",
           s.restaurant_id as "restaurantId"
    from stale s
    join released rel on rel.id = s.id
  `);

  return result.rows;
}
