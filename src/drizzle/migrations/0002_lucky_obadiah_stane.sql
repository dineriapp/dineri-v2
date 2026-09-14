ALTER TABLE "faqs" ADD COLUMN "category_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_category_id_faq_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."faq_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "faqs_category_idx" ON "faqs" USING btree ("category_id");