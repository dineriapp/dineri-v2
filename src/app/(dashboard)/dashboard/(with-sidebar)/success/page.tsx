"use client";
import ClientSideSuccessStoryPage from "./_components/client-side-page";
import { hasFeature } from "@/lib/stripe/checkers";
import FeatureNotAvailable from "@/components/shared/feature-not-available";
import { useAuth } from "@/lib/auth/hooks/use-auth";

const Page = () => {
  const { session } = useAuth();
  const plan = session?.user.subscription.plan ?? "starter";
  const canUseSuccessStory = hasFeature(plan, "success_story");
  if (!canUseSuccessStory) {
    return (
      <FeatureNotAvailable
        featureName="Success Stories"
        showBackButton={false}
        description="Share customer wins and partner stories to build social proof and attract more customers."
        requiredPlan="growth"
      />
    );
  }
  return (
    <>
      <ClientSideSuccessStoryPage />
    </>
  );
};

export default Page;
