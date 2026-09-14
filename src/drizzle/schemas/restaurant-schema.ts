import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { UploadedFile } from "@/components/shared/image-uploader";
import { SmtpConfig } from "@/lib/email/types";
import { StripeConfig } from "@/lib/stripe/types";
import { DEFAULT_OPENING_HOURS, RestaurantOpeningHours } from "@/lib/types";
import { relations } from "drizzle-orm";
import { user } from "./auth-schema";
import { events } from "./event-schema";
import { faqCategories } from "./faq-schema";
import { restaurantGallery } from "./gallery-schema";
import { restaurantLinks } from "./link-schema";
import { menuCategories } from "./menu-schema";
import { successStories } from "./success-story-schema";
import { AppearanceSettings } from "@/lib/types/appearnace";
import { DEFAULT_RESTAURANT_ORDER_SETTINGS, RestaurantOrderSettings } from "@/lib/types/order";
import { qrCodes } from "./qr-codes-schema";
import { EmailTemplates } from "@/app/(dashboard)/dashboard/(with-sidebar)/settings/email/types";
import { popups } from "./popup-schema";
import {
  DEFAULT_RESERVATION_SETTINGS,
  ReservationSettingType,
} from "@/app/(dashboard)/dashboard/(with-sidebar)/reservations/types";
import { ReservationPolicy } from "@/lib/types/reservation-policy";

export const restaurant = pgTable(
  "restaurant",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, {
        onDelete: "cascade",
      }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    bio: text("bio"),
    tagline: text("tagline"),
    logo: jsonb("logo").$type<UploadedFile>(),
    address: text("address"),
    email: text("email"),
    phone: text("phone"),
    website: text("website"),
    // timezone + opening hours
    timezone: text("timezone").notNull().default("Europe/London"),
    opening_hours: jsonb("opening_hours")
      .$type<RestaurantOpeningHours>()
      .notNull()
      .default(DEFAULT_OPENING_HOURS),
    // social links
    instagram: text("instagram"),
    facebook: text("facebook"),
    tiktok: text("tiktok"),
    x_twitter: text("x_twitter"),
    youtube: text("youtube"),
    linkedin: text("linkedin"),
    whatsapp: text("whatsapp"),
    // stripe
    stripe: jsonb("stripe").$type<StripeConfig>(),
    // email config + templates
    // Temporary for verification
    email_config: jsonb("email_config").$type<SmtpConfig>(),
    isEmailIntegrationDone: boolean("is_email_integration_done").default(false).notNull(),
    email_templates: jsonb("email_templates").$type<EmailTemplates>().notNull(),
    // Temporary for verification
    pendingEmailConfig: jsonb("pending_email_config").$type<SmtpConfig | null>(),
    verificationCode: text("verification_code"),
    verificationExpiresAt: timestamp("verification_expires_at"),

    // appearance settings
    appearance_settings: jsonb("appearance_settings").$type<AppearanceSettings>().notNull(),
    // order settings
    orderSettings: jsonb("order_settings")
      .$type<RestaurantOrderSettings>()
      .default(DEFAULT_RESTAURANT_ORDER_SETTINGS)
      .notNull(),
    // reservation settings
    reservation_settings: jsonb("reservation_settings")
      .$type<ReservationSettingType>()
      .default(DEFAULT_RESERVATION_SETTINGS)
      .notNull(),
    // Booking policies
    reservation_policies: jsonb("reservation_policies").$type<ReservationPolicy[]>(),
    // old
    cuisine: text("cuisine"),
    city: text("city"),
    // usage
    link_items_count: integer("link_items_count").default(0).notNull(),
    qr_links_items: integer("qr_links_items").default(0).notNull(),
    nextOrderNumber: integer("next_order_number").default(1).notNull(),
    // menu
    is_menu_published: boolean("is_menu_published").default(false).notNull(),
    // integrations
    googlePlaceId: varchar("google_place_id", { length: 255 }),
    // timestamps
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("restaurant_ownerId_idx").on(table.ownerId),
    index("restaurant_slug_idx").on(table.slug),
  ],
);

export const restaurantRelations = relations(restaurant, ({ one, many }) => ({
  owner: one(user, {
    fields: [restaurant.ownerId],
    references: [user.id],
  }),
  links: many(restaurantLinks),
  menu_categories: many(menuCategories),
  faq_categories: many(faqCategories),
  successStories: many(successStories),
  events: many(events),
  restaurantGallery: many(restaurantGallery),
  qrCodes: many(qrCodes),
  popups: many(popups),
}));
