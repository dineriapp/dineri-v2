import { db } from "@/drizzle/db";
import { restaurant } from "@/drizzle/schema";
import { ensureAuthenticatedUser } from "@/lib/auth/guards";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = await ensureAuthenticatedUser();

  if (!session) {
    redirect("/sign-in");
  }

  const plan =
    session.user.subscription.plan;

  const ownedRestaurants = await db.query.restaurant.findMany({
    where: eq(restaurant.ownerId, session.user.id),
    columns: { id: true },
  });
  const restaurantCount = ownedRestaurants.length;

  // starter & growth => only 1 restaurant
  if (
    (plan === "starter" ||
      plan === "growth") &&
    restaurantCount > 0
  ) {
    redirect("/dashboard");
  }

  if (
    plan === "scale" &&
    restaurantCount >= 5
  ) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}