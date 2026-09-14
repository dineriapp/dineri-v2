ALTER TABLE "reservations" ADD COLUMN "payment_intent_id" text;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "paid_amount" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "refunded_amount" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "refunded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "refund_reference" text;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "refund_reason" text;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "currency" varchar(3);