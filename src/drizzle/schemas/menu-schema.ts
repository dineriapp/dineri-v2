import { UploadedFile } from "@/components/shared/image-uploader";
import { Addon, Tag } from "@/lib/types";
import { relations } from "drizzle-orm";
import {
    boolean,
    index,
    integer,
    jsonb,
    numeric,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar
} from "drizzle-orm/pg-core";
import { restaurant } from "./restaurant-schema";

// Menu categories table
export const menuCategories = pgTable(
    "menu_categories",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        restaurantId: uuid("restaurant_id")
            .notNull()
            .references(() => restaurant.id, { onDelete: "cascade" }),
        name: varchar("name", { length: 255 }).notNull(),
        show_on_public_page: boolean("show_on_public_page").default(false).notNull(),
        sort_order: integer("sort_order").default(0).notNull(),
        created_at: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updated_at: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("menu_categories_restaurant_idx").on(table.restaurantId),
        index("menu_categories_sort_idx").on(table.sort_order),
    ]
);

// Menu items table
export const menuItems = pgTable(
    "menu_items",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        categoryId: uuid("category_id")
            .notNull()
            .references(() => menuCategories.id, { onDelete: "cascade" }),
        image: jsonb("image").$type<UploadedFile>(),

        name: varchar("name", { length: 255 }).notNull(),
        price: numeric("price", {
            precision: 10,
            scale: 2,
        }).notNull(),
        description: text("description"),
        emoji: text("emoji"),
        customization_detail: text("customization_detail"),
        sort_order: integer("sort_order").default(0).notNull(),
        addons: jsonb("addons").$type<Addon[]>().default([]),
        tags: jsonb("tags").$type<Tag[]>().default([]),
        show_on_public_page: boolean("show_on_public_page").default(false).notNull(),

        created_at: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updated_at: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("menu_items_category_idx").on(table.categoryId),
        index("menu_items_sort_idx").on(table.sort_order),
    ]
);

// Relations
export const menuCategoriesRelations = relations(menuCategories, ({ one, many }) => ({
    restaurant: one(restaurant, {
        fields: [menuCategories.restaurantId],
        references: [restaurant.id],
    }),
    items: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
    category: one(menuCategories, {
        fields: [menuItems.categoryId],
        references: [menuCategories.id],
    }),
}));