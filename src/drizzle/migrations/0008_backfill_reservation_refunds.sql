-- Backfill for the refund model introduced in 0007.
--
-- Before this, `amount` meant "whatever Stripe captured" and was left at 0 until
-- the webhook landed, and a refund was recorded by overwriting payment_status
-- with 'refunded' - which destroyed the fact that the booking had been paid at
-- all. These statements move existing rows onto the new columns.

-- 1. Paid bookings: `amount` already held the captured figure, so it is also the
--    paid amount. Its new meaning (the quoted deposit) is the same number here.
UPDATE "reservations"
SET "paid_amount" = "amount"
WHERE "payment_status" = 'paid';

-- 2. Rows stranded in the removed 'refunded' state. They were paid, then fully
--    refunded - the old model could not express anything else. updated_at is the
--    closest thing to a refund timestamp that exists for them.
UPDATE "reservations"
SET "payment_status"  = 'paid',
    "paid_amount"     = "amount",
    "refunded_amount" = "amount",
    "refunded_at"     = "updated_at"
WHERE "payment_status" = 'refunded';

-- 3. Snapshot the venue currency onto rows that carry money, so historical
--    figures stop being relabelled when a venue changes its Stripe currency.
UPDATE "reservations" r
SET "currency" = upper(s."stripe" ->> 'currency')
FROM "restaurant" s
WHERE s."id" = r."restaurant_id"
  AND r."currency" IS NULL
  AND s."stripe" ->> 'currency' IS NOT NULL;

-- Note: pending and failed bookings created before 0007 have amount = 0 and no
-- record of what they were quoted. That figure is unrecoverable, so they stay at
-- 0 and will read as a 0.00 quote forever.
