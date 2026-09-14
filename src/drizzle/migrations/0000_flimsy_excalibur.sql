CREATE TYPE "public"."user_role" AS ENUM('admin', 'user');--> statement-breakpoint
CREATE TYPE "public"."gallery_type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TYPE "public"."qr_shape" AS ENUM('square', 'dots');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"plan" text NOT NULL,
	"reference_id" text NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"status" text DEFAULT 'incomplete',
	"period_start" timestamp,
	"period_end" timestamp,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"cancel_at" timestamp,
	"canceled_at" timestamp,
	"ended_at" timestamp,
	"seats" integer,
	"billing_interval" text,
	"stripe_schedule_id" text
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"stripe_customer_id" text,
	"role" "user_role" NOT NULL,
	"active_restaurant_id" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"bio" text,
	"tagline" text,
	"logo" jsonb,
	"address" text,
	"email" text,
	"phone" text,
	"website" text,
	"timezone" text DEFAULT 'Europe/London' NOT NULL,
	"opening_hours" jsonb DEFAULT '{"0":{"isOpen":false,"openTime":null,"closeTime":null},"1":{"isOpen":false,"openTime":null,"closeTime":null},"2":{"isOpen":false,"openTime":null,"closeTime":null},"3":{"isOpen":false,"openTime":null,"closeTime":null},"4":{"isOpen":false,"openTime":null,"closeTime":null},"5":{"isOpen":false,"openTime":null,"closeTime":null},"6":{"isOpen":false,"openTime":null,"closeTime":null}}'::jsonb NOT NULL,
	"instagram" text,
	"facebook" text,
	"tiktok" text,
	"x_twitter" text,
	"youtube" text,
	"linkedin" text,
	"stripe" jsonb,
	"email_config" jsonb,
	"is_email_integration_done" boolean DEFAULT false NOT NULL,
	"email_templates" jsonb NOT NULL,
	"pending_email_config" jsonb,
	"verification_code" text,
	"verification_expires_at" timestamp,
	"appearance_settings" jsonb NOT NULL,
	"order_settings" jsonb DEFAULT '{"status":"closed","deliveryFee":5,"taxRate":8}'::jsonb NOT NULL,
	"reservation_settings" jsonb DEFAULT '{"emergencyStop":true,"acceptingReservations":false,"requireDeposit":true,"depositAmount":10,"maxPartySize":12,"minPartySize":1,"leadTimeMinutes":60,"maxAdvanceDays":60,"slotDurationMinutes":120,"autoConfirm":false,"autoReleaseMinutes":30,"notifyEmail":false,"notifySms":false,"reminderHours":24,"showOnlineWidget":false,"cancellationHours":24,"allowTableCombination":false,"priorityReservations":false,"priorityReservationAmount":0}'::jsonb NOT NULL,
	"cuisine" text,
	"city" text,
	"link_items_count" integer DEFAULT 0 NOT NULL,
	"qr_links_items" integer DEFAULT 0 NOT NULL,
	"next_order_number" integer DEFAULT 1 NOT NULL,
	"is_menu_published" boolean DEFAULT false NOT NULL,
	"google_place_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "restaurant_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "restaurant_onboarding" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"brand_color" text,
	"vibe" text,
	"hours_from" text,
	"hours_to" text,
	"closed_days" jsonb DEFAULT '[]'::jsonb,
	"menu_size" text,
	"import_method" text,
	"goal" text,
	"diners" jsonb DEFAULT '[]'::jsonb,
	"dietary" jsonb DEFAULT '[]'::jsonb,
	"top_categories" jsonb DEFAULT '[]'::jsonb,
	"peak_times" jsonb DEFAULT '[]'::jsonb,
	"avg_spend" text,
	"channels" jsonb DEFAULT '[]'::jsonb,
	"priorities" jsonb DEFAULT '[]'::jsonb,
	"pain_points" jsonb DEFAULT '[]'::jsonb,
	"nps_ask" boolean DEFAULT true NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"onboarding_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurant_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" varchar(255),
	"url" varchar(2048) NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"icon_key" varchar(100) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"show_on_public_page" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"image" jsonb,
	"name" varchar(255) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"description" text,
	"emoji" text,
	"customization_detail" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"addons" jsonb DEFAULT '[]'::jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"show_on_public_page" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"category" text DEFAULT 'General' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "success_stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"image" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"title" text NOT NULL,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"location" text NOT NULL,
	"capacity" integer DEFAULT 0 NOT NULL,
	"rsvps" integer DEFAULT 0 NOT NULL,
	"description" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurant_gallery" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"type" "gallery_type" NOT NULL,
	"image" jsonb,
	"youtube_url" text,
	"youtube_poster" text,
	"link_url" text,
	"title" text,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"menu_item_id" uuid,
	"item_name" varchar(255) NOT NULL,
	"item_price" numeric(10, 2) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"addons" jsonb DEFAULT '[]'::jsonb,
	"line_total" numeric(10, 2) NOT NULL,
	"customization" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"customer_name" varchar(80) NOT NULL,
	"customer_phone" varchar(30) NOT NULL,
	"customer_email" varchar(255) NOT NULL,
	"location" text NOT NULL,
	"fulfillment" varchar(10) NOT NULL,
	"order_number" integer NOT NULL,
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"payment_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"payment_reference" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qr_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"label" varchar(255) NOT NULL,
	"target_url" text NOT NULL,
	"foreground_color" varchar(7) DEFAULT '#0F1115' NOT NULL,
	"background_color" varchar(7) DEFAULT '#FFFFFF' NOT NULL,
	"shape" "qr_shape" DEFAULT 'dots' NOT NULL,
	"scans" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "popups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"badge" varchar(40),
	"title" varchar(255) NOT NULL,
	"body" varchar(1000) NOT NULL,
	"cta" varchar(100) NOT NULL,
	"cta_url" varchar(2048) NOT NULL,
	"footer_note" varchar(160),
	"on_page" varchar(20) NOT NULL,
	"trigger_after_seconds" integer DEFAULT 0 NOT NULL,
	"status" varchar(10) DEFAULT 'paused' NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservation_areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"name" varchar(80) NOT NULL,
	"description" text,
	"color" varchar(30) DEFAULT 'lime' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservation_tables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"area_id" uuid NOT NULL,
	"label" varchar(50) NOT NULL,
	"seats" integer DEFAULT 2 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"area_id" uuid,
	"assigned_tables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"guest_name" varchar(80) NOT NULL,
	"guest_phone" varchar(30) NOT NULL,
	"guest_email" varchar(255) NOT NULL,
	"party_size" integer NOT NULL,
	"date" date NOT NULL,
	"time" time NOT NULL,
	"note" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"payment_status" varchar(20) DEFAULT 'free' NOT NULL,
	"payment_reference" text,
	"amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"is_priority_reservation" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"actor_user_id" text,
	"actor_name" varchar(120),
	"source" varchar(12) NOT NULL,
	"type" varchar(48) NOT NULL,
	"entity_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant" ADD CONSTRAINT "restaurant_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_onboarding" ADD CONSTRAINT "restaurant_onboarding_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_links" ADD CONSTRAINT "restaurant_links_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_menu_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."menu_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "success_stories" ADD CONSTRAINT "success_stories_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_gallery" ADD CONSTRAINT "restaurant_gallery_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "popups" ADD CONSTRAINT "popups_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_areas" ADD CONSTRAINT "reservation_areas_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_tables" ADD CONSTRAINT "reservation_tables_area_id_reservation_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."reservation_areas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_area_id_reservation_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."reservation_areas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "restaurant_ownerId_idx" ON "restaurant" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "restaurant_slug_idx" ON "restaurant" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "restaurant_profile_restaurant_id_idx" ON "restaurant_onboarding" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "restaurant_profile_onboarding_completed_idx" ON "restaurant_onboarding" USING btree ("onboarding_completed");--> statement-breakpoint
CREATE INDEX "menu_categories_restaurant_idx" ON "menu_categories" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "menu_categories_sort_idx" ON "menu_categories" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "menu_items_category_idx" ON "menu_items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "menu_items_sort_idx" ON "menu_items" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "faqs_restaurant_idx" ON "faqs" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "faqs_sort_order_idx" ON "faqs" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "faqs_category_idx" ON "faqs" USING btree ("category");--> statement-breakpoint
CREATE INDEX "success_stories_restaurant_idx" ON "success_stories" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "success_stories_sort_order_idx" ON "success_stories" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "success_stories_active_idx" ON "success_stories" USING btree ("active");--> statement-breakpoint
CREATE INDEX "events_restaurant_idx" ON "events" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "events_sort_order_idx" ON "events" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "events_active_idx" ON "events" USING btree ("active");--> statement-breakpoint
CREATE INDEX "events_date_idx" ON "events" USING btree ("date");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_menu_item_idx" ON "order_items" USING btree ("menu_item_id");--> statement-breakpoint
CREATE INDEX "orders_restaurant_created_idx" ON "orders" USING btree ("restaurant_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_restaurant_status_created_idx" ON "orders" USING btree ("restaurant_id","status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_restaurant_order_number_idx" ON "orders" USING btree ("restaurant_id","order_number");--> statement-breakpoint
CREATE INDEX "qr_codes_restaurant_idx" ON "qr_codes" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "popups_restaurant_idx" ON "popups" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "popups_status_idx" ON "popups" USING btree ("status");--> statement-breakpoint
CREATE INDEX "popups_on_page_idx" ON "popups" USING btree ("on_page");--> statement-breakpoint
CREATE INDEX "reservation_areas_restaurant_idx" ON "reservation_areas" USING btree ("restaurant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reservation_areas_restaurant_name_unique" ON "reservation_areas" USING btree ("restaurant_id",lower("name"));--> statement-breakpoint
CREATE INDEX "reservation_tables_area_idx" ON "reservation_tables" USING btree ("area_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reservation_tables_area_label_unique" ON "reservation_tables" USING btree ("area_id",lower("label"));--> statement-breakpoint
CREATE INDEX "reservations_restaurant_date_idx" ON "reservations" USING btree ("restaurant_id","date","time","id");--> statement-breakpoint
CREATE INDEX "reservations_restaurant_status_idx" ON "reservations" USING btree ("restaurant_id","status");--> statement-breakpoint
CREATE INDEX "reservations_area_idx" ON "reservations" USING btree ("area_id");--> statement-breakpoint
CREATE INDEX "reservations_payment_reference_idx" ON "reservations" USING btree ("payment_reference");--> statement-breakpoint
CREATE INDEX "activity_events_restaurant_created_idx" ON "activity_events" USING btree ("restaurant_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "activity_events_restaurant_type_created_idx" ON "activity_events" USING btree ("restaurant_id","type","created_at" DESC NULLS LAST);