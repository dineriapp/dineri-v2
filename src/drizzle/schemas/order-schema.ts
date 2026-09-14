import { relations } from "drizzle-orm";
import {
    index,
    integer,
    jsonb,
    numeric,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
    varchar
} from "drizzle-orm/pg-core";
import { menuItems } from "./menu-schema";
import { restaurant } from "./restaurant-schema";

export const orderStatusEnum = [
    "new",
    "confirmed",
    "preparing",
    "ready",
    "delivered",
    "cancelled",
] as const;
export type OrderStatus = (typeof orderStatusEnum)[number];

export const paymentStatusEnum = ["pending", "paid", "failed", "refunded"] as const;
export type PaymentStatus = (typeof paymentStatusEnum)[number];

export const fulfillmentEnum = ["pickup", "delivery"] as const;
export type Fulfillment = (typeof fulfillmentEnum)[number];

export const orders = pgTable(
    "orders",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        restaurantId: uuid("restaurant_id")
            .notNull()
            .references(() => restaurant.id, { onDelete: "cascade" }),

        name: varchar("customer_name", { length: 80 }).notNull(),
        phone: varchar("customer_phone", { length: 30 }).notNull(),
        email: varchar("customer_email", { length: 255 }).notNull(),
        location: text("location").notNull(),
        fulfillment: varchar("fulfillment", { length: 10 })
            .$type<Fulfillment>()
            .notNull(),

        orderNumber: integer("order_number").notNull(),
        status: varchar("status", { length: 20 })
            .$type<OrderStatus>()
            .notNull()
            .default("new"),
        paymentStatus: varchar("payment_status", { length: 20 })
            .$type<PaymentStatus>()
            .notNull()
            .default("pending"),

        subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
        total: numeric("total", { precision: 10, scale: 2 }).notNull(),
        currency: varchar("currency", { length: 3 }).notNull(),

        paymentReference: varchar("payment_reference", { length: 255 }),

        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("orders_restaurant_created_idx").on(table.restaurantId, table.createdAt),
        index("orders_restaurant_status_created_idx").on(table.restaurantId, table.status, table.createdAt),
        uniqueIndex("orders_restaurant_order_number_idx").on(table.restaurantId, table.orderNumber),
    ]
);

export const orderItems = pgTable(
    "order_items",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        orderId: uuid("order_id")
            .notNull()
            .references(() => orders.id, { onDelete: "cascade" }),
        menuItemId: uuid("menu_item_id")
            .references(() => menuItems.id, { onDelete: "set null" }),

        itemName: varchar("item_name", { length: 255 }).notNull(),
        itemPrice: numeric("item_price", { precision: 10, scale: 2 }).notNull(),
        quantity: integer("quantity").notNull().default(1),

        addons: jsonb("addons").$type<{ label: string; price: number }[]>().default([]),

        lineTotal: numeric("line_total", { precision: 10, scale: 2 }).notNull(),

        customization: text("customization"),

        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("order_items_order_idx").on(table.orderId),
        index("order_items_menu_item_idx").on(table.menuItemId),
    ]
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
    restaurant: one(restaurant, {
        fields: [orders.restaurantId],
        references: [restaurant.id],
    }),
    items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, {
        fields: [orderItems.orderId],
        references: [orders.id],
    }),
    menuItem: one(menuItems, {
        fields: [orderItems.menuItemId],
        references: [menuItems.id],
    }),
}));