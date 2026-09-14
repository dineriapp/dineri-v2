import { ensureAuthenticatedUser } from "@/lib/auth/guards";
import { redirect } from "next/navigation";
import SettingsPopupsClientPage from "./_components/client-page";
import { StarterLockedUI } from "./_components/starter-lock-ui";

const Page = async () => {
  const { session } = await ensureAuthenticatedUser();

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.subscription.plan === "starter") {
    return <StarterLockedUI />;
  }

  return <SettingsPopupsClientPage />;
};

export default Page;
