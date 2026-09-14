import { UploadedFile } from "@/components/shared/image-uploader";
import { relations } from "drizzle-orm";
import {
    boolean,
    integer,
    jsonb,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid
} from "drizzle-orm/pg-core";
import { restaurant } from "./restaurant-schema";

export const galleryTypeEnum = pgEnum("gallery_type", ["image", "video"]);

export const restaurantGallery = pgTable("restaurant_gallery", {
    id: uuid("id").defaultRandom().primaryKey(),

    restaurantId: uuid("restaurant_id")
        .notNull()
        .references(() => restaurant.id, { onDelete: "cascade" }),

    type: galleryTypeEnum().notNull(),

    // For type='image': the uploaded image file metadata
    // For type='video': optional custom poster/thumbnail (if not provided, YouTube default is used)
    image: jsonb("image").$type<UploadedFile>(),

    // For type='video': YouTube URL (required)
    youtube_url: text("youtube_url"),
    youtube_poster: text("youtube_poster"),

    // For type='image': where to redirect when clicked (optional)
    link_url: text("link_url"),

    // Title – (optional)
    title: text("title"),

    active: boolean("active").notNull().default(true),

    sort_order: integer("sort_order").notNull().default(0),

    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

// Relations
export const restaurantGalleryRelations = relations(restaurantGallery, ({ one }) => ({
    restaurant: one(restaurant, {
        fields: [restaurantGallery.restaurantId],
        references: [restaurant.id],
    }),
}));