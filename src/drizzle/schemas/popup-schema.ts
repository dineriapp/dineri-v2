import { relations } from "drizzle-orm";
import { index, integer, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { restaurant } from "./restaurant-schema";

export const popupTriggerEnum = [0, 10, 30, 60] as const;
export type PopupTrigger = (typeof popupTriggerEnum)[number];

export const popupStatusEnum = ["live", "paused"] as const;
export type PopupStatus = (typeof popupStatusEnum)[number];

export const popupOnPageEnum = ["restaurant", "menu", "reserve"] as const;
export type PopupOnPage = (typeof popupOnPageEnum)[number];

export const popups = pgTable(
    "popups",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        restaurantId: uuid("restaurant_id")
            .notNull()
            .references(() => restaurant.id, { onDelete: "cascade" }),
        // Small eyebrow label shown above the title (e.g. "Welcome"). Optional.
        badge: varchar("badge", { length: 40 }),
        title: varchar("title", { length: 255 }).notNull(),
        body: varchar("body", { length: 1000 }).notNull(),
        cta: varchar("cta", { length: 100 }).notNull(),
        ctaUrl: varchar("cta_url", { length: 2048 }).notNull(),
        // Small caption under the buttons (e.g. "No credit card required"). Optional.
        footerNote: varchar("footer_note", { length: 160 }),
        onPage: varchar("on_page", { length: 20 }).$type<PopupOnPage>().notNull(),
        trigger_after_seconds: integer("trigger_after_seconds")
            .$type<PopupTrigger>()
            .notNull()
            .default(0),
        status: varchar("status", { length: 10 }).$type<PopupStatus>().notNull().default("paused"),
        impressions: integer("impressions").notNull().default(0),
        clicks: integer("clicks").notNull().default(0),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("popups_restaurant_idx").on(table.restaurantId),
        index("popups_status_idx").on(table.status),
        index("popups_on_page_idx").on(table.onPage),
    ],
);

export const popupsRelations = relations(popups, ({ one }) => ({
    restaurant: one(restaurant, {
        fields: [popups.restaurantId],
        references: [restaurant.id],
    }),
}));
