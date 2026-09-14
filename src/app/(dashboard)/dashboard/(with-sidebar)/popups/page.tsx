import { ensureAuthenticatedUser } from "@/lib/auth/guards";
import { redirect } from "next/navigation";
import PopupsClientPage from "./_components/client-page";

const Page = async () => {
  const { session } = await ensureAuthenticatedUser();

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.subscription.plan === "starter") {
    redirect("/dashboard");
  }

  return <PopupsClientPage />;
};

export default Page;
