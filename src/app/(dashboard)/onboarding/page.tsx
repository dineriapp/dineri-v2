import { Metadata } from "next";
import OnboardingFlow from "./_components/onboarding-flow";

export const metadata: Metadata = {
  title: "Onboarding - Dineri",
  description: "Set up your Dineri venue in 6 quick steps.",
};

const Page = () => {
  return <OnboardingFlow />;
};

export default Page;
