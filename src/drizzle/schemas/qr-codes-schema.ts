import { relations } from "drizzle-orm";
import {
    index,
    integer,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";
import { restaurant } from "./restaurant-schema";


export const qrShapeEnum = pgEnum("qr_shape", [
    "square",
    "dots",
]);

export const qrCodes = pgTable(
    "qr_codes",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        restaurantId: uuid("restaurant_id")
            .notNull()
            .references(() => restaurant.id, { onDelete: "cascade" }),

        label: varchar("label", { length: 255 }).notNull(),
        targetUrl: text("target_url").notNull(),

        foregroundColor: varchar("foreground_color", { length: 7 }).default("#0F1115").notNull(),
        backgroundColor: varchar("background_color", { length: 7 }).default("#FFFFFF").notNull(),
        shape: qrShapeEnum("shape").default("dots").notNull(),

        scans: integer("scans").default(0).notNull(),

        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("qr_codes_restaurant_idx").on(table.restaurantId),
    ]
);

export const qrCodesRelations = relations(qrCodes, ({ one }) => ({
    restaurant: one(restaurant, {
        fields: [qrCodes.restaurantId],
        references: [restaurant.id],
    }),
}));
