import {
    boolean,
    index,
    jsonb,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

import { restaurant } from "./restaurant-schema";

export const restaurantOnBoarding = pgTable(
    "restaurant_onboarding",
    {
        id: uuid("id")
            .defaultRandom()
            .primaryKey(),

        restaurantId: uuid("restaurant_id")
            .notNull()
            .references(() => restaurant.id, {
                onDelete: "cascade",
            }),
        //  Branding
        brandColor: text("brand_color"),

        vibe: text("vibe").$type<
            "minimal" | "warm" | "bold"
        >(),
        //  Hours
        hoursFrom: text("hours_from"),
        hoursTo: text("hours_to"),
        closedDays: jsonb("closed_days")
            .$type<string[]>()
            .default([]),
        // Menu
        menuSize: text("menu_size").$type<
            "small" | "medium" | "large"
        >(),
        importMethod: text("import_method").$type<
            "manual" | "pdf" | "link"
        >(),
        goal: text("goal"),
        // Audience / analytics
        diners: jsonb("diners")
            .$type<string[]>()
            .default([]),
        dietary: jsonb("dietary")
            .$type<string[]>()
            .default([]),
        topCategories: jsonb("top_categories")
            .$type<string[]>()
            .default([]),
        peakTimes: jsonb("peak_times")
            .$type<string[]>()
            .default([]),
        avgSpend: text("avg_spend").$type<
            "under15" | "15to30" | "30to60" | "over60"
        >(),
        channels: jsonb("channels")
            .$type<string[]>()
            .default([]),
        priorities: jsonb("priorities")
            .$type<string[]>()
            .default([]),
        painPoints: jsonb("pain_points")
            .$type<string[]>()
            .default([]),
        // Features
        npsAsk: boolean("nps_ask")
            .notNull()
            .default(true),
        //  Onboarding
        onboardingCompleted: boolean(
            "onboarding_completed"
        )
            .notNull()
            .default(false),
        onboardingCompletedAt: timestamp(
            "onboarding_completed_at",
            {
                withTimezone: true,
            }
        ),
        // Metadata
        createdAt: timestamp("created_at", {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", {
            withTimezone: true,
        })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        uniqueIndex(
            "restaurant_profile_restaurant_id_idx"
        ).on(table.restaurantId),

        index(
            "restaurant_profile_onboarding_completed_idx"
        ).on(table.onboardingCompleted),
    ]
);

export const restaurantProfileRelations =
    relations(
        restaurantOnBoarding,
        ({ one }) => ({
            restaurant: one(restaurant, {
                fields: [restaurantOnBoarding.restaurantId],
                references: [restaurant.id],
            }),
        })
    );