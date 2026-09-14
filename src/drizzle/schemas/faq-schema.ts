import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { restaurant } from "./restaurant-schema";

export const faqCategories = pgTable(
  "faq_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurant.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    active: boolean("active").notNull().default(true),
    sort_order: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("faq_categories_restaurant_idx").on(table.restaurantId),
    index("faq_categories_sort_order_idx").on(table.sort_order),
  ],
);

export const faqs = pgTable(
  "faqs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => faqCategories.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    active: boolean("active").notNull().default(true),
    sort_order: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("faqs_category_idx").on(table.categoryId),
    index("faqs_sort_order_idx").on(table.sort_order),
  ],
);

// Relations
export const faqCategoriesRelations = relations(faqCategories, ({ one, many }) => ({
  restaurant: one(restaurant, {
    fields: [faqCategories.restaurantId],
    references: [restaurant.id],
  }),
  items: many(faqs),
}));

export const faqsRelations = relations(faqs, ({ one }) => ({
  category: one(faqCategories, {
    fields: [faqs.categoryId],
    references: [faqCategories.id],
  }),
}));
