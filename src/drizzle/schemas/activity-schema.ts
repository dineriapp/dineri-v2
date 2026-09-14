import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { restaurant } from "./restaurant-schema";

export const activitySourceEnum = ["merchant", "guest", "system"] as const;
export type ActivitySource = (typeof activitySourceEnum)[number];

export const activityEvents = pgTable(
    "activity_events",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        restaurantId: uuid("restaurant_id")
            .notNull()
            .references(() => restaurant.id, { onDelete: "cascade" }),
        actorUserId: text("actor_user_id").references(() => user.id, { onDelete: "set null" }),
        actorName: varchar("actor_name", { length: 120 }),
        source: varchar("source", { length: 12 }).$type<ActivitySource>().notNull(),

        type: varchar("type", { length: 48 }).notNull(),
        entityId: text("entity_id"),

        data: jsonb("data").notNull().default({}),

        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        index("activity_events_restaurant_created_idx").on(
            table.restaurantId,
            table.createdAt.desc()
        ),
        index("activity_events_restaurant_type_created_idx").on(
            table.restaurantId,
            table.type,
            table.createdAt.desc()
        ),
    ]
);

export const activityEventsRelations = relations(activityEvents, ({ one }) => ({
    restaurant: one(restaurant, {
        fields: [activityEvents.restaurantId],
        references: [restaurant.id],
    }),
    actor: one(user, {
        fields: [activityEvents.actorUserId],
        references: [user.id],
    }),
}));
