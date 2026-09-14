import {
  menuCategories,
  menuItems,
  orderItems,
  orders,
  qrCodes,
  restaurant,
  restaurantGallery,
  restaurantLinks,
} from "@/drizzle/schema";
import { InferSelectModel } from "drizzle-orm";
import { userRoleEnum } from "./schema";
import { events } from "./schemas/event-schema";
import { faqCategories, faqs } from "./schemas/faq-schema";
import { popups } from "./schemas/popup-schema";
import { reservationAreas, reservations, reservationTables } from "./schemas/reservation-schema";
import { successStories } from "./schemas/success-story-schema";

export type RestaurantType = InferSelectModel<typeof restaurant>;
export type UserRoleType = (typeof userRoleEnum.enumValues)[number];
export type RestaurantStoreType = RestaurantType;

// links
export type LinkType = InferSelectModel<typeof restaurantLinks>;
// menu types
export type MenuCategoryType = InferSelectModel<typeof menuCategories>;
export type MenuItemType = InferSelectModel<typeof menuItems>;
export type MenuCategoryWithItems = MenuCategoryType & {
  items: MenuItemType[];
};
// faqs
export type FaqCategoryType = InferSelectModel<typeof faqCategories>;
export type FaqType = InferSelectModel<typeof faqs>;
export type FaqCategoryWithItems = FaqCategoryType & {
  items: FaqType[];
};
// success story
export type SuccessStoryType = InferSelectModel<typeof successStories>;
// event
export type EventType = InferSelectModel<typeof events>;
// gallery
export type GalleryType = InferSelectModel<typeof restaurantGallery>;

// order
export type Order = InferSelectModel<typeof orders>;
type OrderItemType = InferSelectModel<typeof orderItems>;

export type OrderWithItems = Order & {
  items: OrderItemType[];
};
// qr code
export type QRCodeType = InferSelectModel<typeof qrCodes>;
// popup
export type PopupType = InferSelectModel<typeof popups>;
// reservation areas & tables
type ReservationAreaType = InferSelectModel<typeof reservationAreas>;
export type ReservationTableType = InferSelectModel<typeof reservationTables>;
export type ReservationAreaWithTables = ReservationAreaType & {
  tables: ReservationTableType[];
};
type ReservationType = InferSelectModel<typeof reservations>;
export type ReservationWithArea = ReservationType & {
  area: { id: string; name: string; color: string } | null;
  assignedTables: { id: string; label: string; seats: number }[];
};
