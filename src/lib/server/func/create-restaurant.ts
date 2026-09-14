"use server";

import slugify from "slugify";

import { ensureAuthenticatedUser } from "@/lib/auth/guards";

import { TEMPLATES } from "@/app/(dashboard)/dashboard/(with-sidebar)/appearance/_components/sections/templates-data";
import { defaultEmailTemplates } from "@/app/(dashboard)/dashboard/(with-sidebar)/settings/email/constants";
import { db } from "@/drizzle/db";
import { popups, restaurant } from "@/drizzle/schema";
import { restaurantOnBoarding } from "@/drizzle/schemas/restaurant-onboarding-schema";
import { DEFAULT_APPEARANCE } from "@/lib/types/appearnace";
import { Data } from "@/lib/types/onboarding";
import { eq } from "drizzle-orm";

function defaultPopups(venueName: string, slug: string, baseUrl: string) {
  return [
    {
      badge: "Welcome",
      title: `Welcome to ${venueName}! 👋`,
      body: "We're delighted to have you here. Explore our delicious menu, reserve your table in seconds, and discover everything we have prepared to make your visit a memorable dining experience.",
      cta: "View menu",
      ctaUrl: `${baseUrl}/r/${slug}/menu`,
      onPage: "restaurant" as const,
      trigger_after_seconds: 0 as const,
      status: "live" as const,
    },
    {
      badge: "Welcome",
      title: "Hungry? Let's get started 👋",
      body: "Take a look through our full menu, discover customer favorites, and order the dishes you love. Fresh flavors and great experiences are just a few clicks away.",
      cta: "Start ordering",
      ctaUrl: `${baseUrl}/r/${slug}/menu`,
      onPage: "menu" as const,
      trigger_after_seconds: 0 as const,
      status: "live" as const,
    },
    {
      badge: "Reserve",
      title: "Book your table 👋",
      body: "Planning your next meal with us? Reserve your table in just a few clicks, and we'll have everything ready so you can relax and enjoy your visit.",
      cta: "Book now",
      ctaUrl: `${baseUrl}/r/${slug}/reserve`,
      onPage: "reserve" as const,
      trigger_after_seconds: 0 as const,
      status: "live" as const,
    },
  ];
}

type Response =
  | {
      success: true;
      restaurantId: string;
    }
  | {
      success: false;
      error: string;
    };

export const createRestaurant = async (data: Data): Promise<Response> => {
  try {
    const session = await ensureAuthenticatedUser();

    if (!session?.session?.user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const user = session.session.user;

    // Generate unique slug

    const baseSlug = slugify(data.venue, {
      lower: true,
      strict: true,
      trim: true,
    });

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existingRestaurant = await db.query.restaurant.findFirst({
        where: eq(restaurant.slug, slug),
        columns: {
          id: true,
        },
      });

      if (!existingRestaurant) {
        break;
      }

      counter++;

      slug = `${baseSlug}-${counter}`;
    }

    // Transaction

    const result = await db.transaction(async (tx) => {
      const [createdRestaurant] = await tx
        .insert(restaurant)
        .values({
          ownerId: user.id,
          name: data.venue,
          slug,
          email: user?.email ?? "",
          cuisine: data.cuisine,
          city: data.city,
          phone: data.phone,
          email_templates: defaultEmailTemplates,
          appearance_settings:
            TEMPLATES.find((t) => t.id === data.brandColor)?.settings ?? DEFAULT_APPEARANCE,
        })
        .returning();

      await tx.insert(restaurantOnBoarding).values({
        restaurantId: createdRestaurant.id,

        brandColor: data.brandColor,
        vibe: data.vibe,

        hoursFrom: data.hoursFrom,
        hoursTo: data.hoursTo,
        closedDays: data.closedDays,

        menuSize: data.menuSize,
        importMethod: data.importMethod,

        goal: data.goal,

        diners: data.diners,
        dietary: data.dietary,
        topCategories: data.topCategories,
        peakTimes: data.peakTimes,

        avgSpend: data.avgSpend,

        channels: data.channels,
        priorities: data.priorities,
        painPoints: data.painPoints,

        npsAsk: data.npsAsk,

        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
      });

      const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
      await tx.insert(popups).values(
        defaultPopups(data.venue, slug, baseUrl).map((p) => ({
          ...p,
          restaurantId: createdRestaurant.id,
        })),
      );

      return createdRestaurant;
    });

    return {
      success: true,
      restaurantId: result.id,
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
};
