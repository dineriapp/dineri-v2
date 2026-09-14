import { boolean, index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { restaurant } from "./restaurant-schema";
import { UploadedFile } from "@/components/shared/image-uploader";

export const successStories = pgTable("success_stories", {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
        .notNull()
        .references(() => restaurant.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    image: jsonb("image").$type<UploadedFile>().notNull(),
    active: boolean("active").notNull().default(true),
    sort_order: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
},
    (table) => [
        index("success_stories_restaurant_idx").on(table.restaurantId),
        index("success_stories_sort_order_idx").on(table.sort_order),
        index("success_stories_active_idx").on(table.active),
    ]
);

export const successStoriesRelations = relations(successStories, ({ one }) => ({
    restaurant: one(restaurant, {
        fields: [successStories.restaurantId],
        references: [restaurant.id],
    }),
}));