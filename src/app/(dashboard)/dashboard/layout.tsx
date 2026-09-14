import { RestaurantStoreHydrator } from "@/components/hydrators/restaurant-store-hydrator";
import { db } from "@/drizzle/db";
import { restaurant } from "@/drizzle/schema";
import { ensureAuthenticatedUser } from "@/lib/auth/guards";
import { toPublicSmtpConfig, toPublicStripeConfig } from "@/lib/security/public-config";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function DashboarMaindLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await ensureAuthenticatedUser();

  if (!session?.session) {
    redirect("/sign-in");
  }

  if (session.session.user.role === "admin") {
    redirect("/admin");
  }

  const activeRestaurantId = session.session.user.activeRestaurantId;

  if (!activeRestaurantId || activeRestaurantId === "") {
    redirect("/onboarding");
  }

  const activeRestaurant = await db.query.restaurant.findFirst({
    where: eq(restaurant.id, activeRestaurantId),
  });

  if (!activeRestaurant) {
    redirect("/onboarding");
  }

  const { stripe, email_config, ...rest } = activeRestaurant;

  return (
    <>
      <RestaurantStoreHydrator
        restaurant={{
          ...rest,
          pendingEmailConfig: null,
          verificationCode: null,
          stripe: toPublicStripeConfig(stripe),
          email_config: toPublicSmtpConfig(email_config),
        }}
      />
      {children}
    </>
  );
}
