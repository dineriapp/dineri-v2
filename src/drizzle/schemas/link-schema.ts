import {
    boolean,
    integer,
    pgTable,
    timestamp,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";
import { restaurant } from "./restaurant-schema";

export const restaurantLinks = pgTable("restaurant_links", {
    id: uuid("id").defaultRandom().primaryKey(),

    restaurantId: uuid("restaurant_id")
        .notNull()
        .references(() => restaurant.id, {
            onDelete: "cascade",
        }),

    title: varchar("title", { length: 255 }).notNull(),
    description: varchar("description", { length: 255 }),

    url: varchar("url", { length: 2048 }).notNull(),

    clicks: integer("clicks").notNull().default(0),

    active: boolean("active").notNull().default(true),

    icon_key: varchar("icon_key", { length: 100 }).notNull(),

    sort_order: integer("sort_order").notNull().default(0),

    created_at: timestamp("created_at", {
        withTimezone: true,
    }).defaultNow().notNull(),

    updated_at: timestamp("updated_at", {
        withTimezone: true,
    })
        .defaultNow()
        .notNull(),
});

import { relations } from "drizzle-orm";

export const restaurantLinksRelations = relations(
    restaurantLinks,
    ({ one }) => ({
        restaurant: one(restaurant, {
            fields: [restaurantLinks.restaurantId],
            references: [restaurant.id],
        }),
    })
);

