import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { restaurant } from "./restaurant-schema";

export type AssignedTableSnapshot = { id: string; label: string; seats: number };

export const reservationAreas = pgTable(
  "reservation_areas",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurant.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 80 }).notNull(),
    description: text("description"),
    color: varchar("color", { length: 30 }).notNull().default("lime"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("reservation_areas_restaurant_idx").on(table.restaurantId),
    uniqueIndex("reservation_areas_restaurant_name_unique").on(
      table.restaurantId,
      sql`lower(${table.name})`,
    ),
  ],
);

export const reservationTables = pgTable(
  "reservation_tables",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    areaId: uuid("area_id")
      .notNull()
      .references(() => reservationAreas.id, { onDelete: "cascade" }),

    label: varchar("label", { length: 50 }).notNull(),
    seats: integer("seats").notNull().default(2),
    active: boolean("active").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("reservation_tables_area_idx").on(table.areaId),
    uniqueIndex("reservation_tables_area_label_unique").on(
      table.areaId,
      sql`lower(${table.label})`,
    ),
  ],
);

export const reservationStatusEnum = [
  "pending",
  "confirmed",
  "seated",
  "completed",
  "no_show",
  "cancelled",
] as const;
export type ReservationStatus = (typeof reservationStatusEnum)[number];

export const reservationPaymentStatusEnum = ["free", "pending", "paid", "failed"] as const;
export type ReservationPaymentStatus = (typeof reservationPaymentStatusEnum)[number];

export const reservations = pgTable(
  "reservations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurant.id, { onDelete: "cascade" }),
    areaId: uuid("area_id").references(() => reservationAreas.id, { onDelete: "cascade" }),
    assignedTables: jsonb("assigned_tables").$type<AssignedTableSnapshot[]>().notNull().default([]),

    guestName: varchar("guest_name", { length: 80 }).notNull(),
    guestPhone: varchar("guest_phone", { length: 30 }).notNull(),
    guestEmail: varchar("guest_email", { length: 255 }).notNull(),

    partySize: integer("party_size").notNull(),
    date: date("date").notNull(),
    time: time("time").notNull(),

    note: text("note"),

    status: varchar("status", { length: 20 })
      .$type<ReservationStatus>()
      .notNull()
      .default("pending"),
    paymentStatus: varchar("payment_status", { length: 20 })
      .$type<ReservationPaymentStatus>()
      .notNull()
      .default("free"),
    paymentReference: text("payment_reference"),
    paymentIntentId: text("payment_intent_id"),

    amount: numeric("amount", { precision: 10, scale: 2 }).notNull().default("0"),
    paidAmount: numeric("paid_amount", { precision: 10, scale: 2 }).notNull().default("0"),

    refundedAmount: numeric("refunded_amount", { precision: 10, scale: 2 }).notNull().default("0"),
    refundedAt: timestamp("refunded_at", { withTimezone: true }),
    refundReference: text("refund_reference"),
    refundReason: text("refund_reason"),
    currency: varchar("currency", { length: 3 }),
    isPriorityReservation: boolean("is_priority_reservation").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("reservations_restaurant_date_idx").on(
      table.restaurantId,
      table.date,
      table.time,
      table.id,
    ),
    index("reservations_restaurant_status_idx").on(table.restaurantId, table.status),
    index("reservations_area_idx").on(table.areaId),
    index("reservations_payment_reference_idx").on(table.paymentReference),
  ],
);

export const reservationAreasRelations = relations(reservationAreas, ({ one, many }) => ({
  restaurant: one(restaurant, {
    fields: [reservationAreas.restaurantId],
    references: [restaurant.id],
  }),
  tables: many(reservationTables),
  reservations: many(reservations),
}));

export const reservationTablesRelations = relations(reservationTables, ({ one }) => ({
  area: one(reservationAreas, {
    fields: [reservationTables.areaId],
    references: [reservationAreas.id],
  }),
}));

export const reservationsRelations = relations(reservations, ({ one }) => ({
  restaurant: one(restaurant, {
    fields: [reservations.restaurantId],
    references: [restaurant.id],
  }),
  area: one(reservationAreas, {
    fields: [reservations.areaId],
    references: [reservationAreas.id],
  }),
}));
