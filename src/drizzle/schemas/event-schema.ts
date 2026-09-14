import { relations } from "drizzle-orm";
import { boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { restaurant } from "./restaurant-schema";

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurant.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    date: text("date").notNull(), // ISO date string 'YYYY-MM-DD'
    time: text("time").notNull(), // 'HH:MM'
    location: text("location").notNull(),
    description: text("description").notNull(),
    buttonText: text("button_text"),
    buttonLink: text("button_link"),
    active: boolean("active").notNull().default(true),
    sort_order: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("events_restaurant_idx").on(table.restaurantId),
    index("events_sort_order_idx").on(table.sort_order),
    index("events_active_idx").on(table.active),
    index("events_date_idx").on(table.date),
  ],
);

// Relations
export const eventsRelations = relations(events, ({ one }) => ({
  restaurant: one(restaurant, {
    fields: [events.restaurantId],
    references: [restaurant.id],
  }),
}));
