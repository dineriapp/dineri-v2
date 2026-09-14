import FeatureNotAvailable from "@/components/shared/feature-not-available";
import { ensureAuthenticatedUser } from "@/lib/auth/guards";
import { hasFeature } from "@/lib/stripe/checkers";
import { Metadata } from "next";
import TopBar from "../../../_components/top-bar";
import { NewReservationForm } from "./_components/new-reservation-form";

export const metadata: Metadata = {
  title: "New reservation",
  description: "Create a reservation from the dashboard.",
};

type Props = {
  searchParams: Promise<{ date?: string; time?: string; areaId?: string }>;
};

const Page = async ({ searchParams }: Props) => {
  const { date, time, areaId } = await searchParams;

  const auth = await ensureAuthenticatedUser();
  const plan = auth.session?.user.subscription.plan ?? "starter";
  if (!hasFeature(plan, "reservations")) {
    return (
      <FeatureNotAvailable
        featureName="Reservations"
        showBackButton={false}
        description="Take table bookings from your page, manage the floor, and track covers per service."
        requiredPlan="growth"
      />
    );
  }

  return (
    <>
      <TopBar page={["Reservations", "New"]} />
      <div className="animate-fade-in space-y-4 p-4 sm:space-y-6 sm:p-6">
        <NewReservationForm prefill={{ date, time, areaId }} />
      </div>
    </>
  );
};

export default Page;
