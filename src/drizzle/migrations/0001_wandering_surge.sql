--> Questions are re-filed under categories from here on, and the old rows carry
--> a free-text category that cannot be resolved to one. They are cleared so the
--> NOT NULL category_id added in 0002 can be applied on any environment.
DELETE FROM "faqs";--> statement-breakpoint
CREATE TABLE "faq_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "faqs" DROP CONSTRAINT "faqs_restaurant_id_restaurant_id_fk";
--> statement-breakpoint
DROP INDEX "faqs_restaurant_idx";--> statement-breakpoint
DROP INDEX "faqs_category_idx";--> statement-breakpoint
ALTER TABLE "faq_categories" ADD CONSTRAINT "faq_categories_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "faq_categories_restaurant_idx" ON "faq_categories" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "faq_categories_sort_order_idx" ON "faq_categories" USING btree ("sort_order");--> statement-breakpoint
ALTER TABLE "faqs" DROP COLUMN "restaurant_id";--> statement-breakpoint
ALTER TABLE "faqs" DROP COLUMN "category";