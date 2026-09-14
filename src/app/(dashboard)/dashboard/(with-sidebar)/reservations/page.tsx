import { ReservationsWorkspace } from "./_components/reservations-workspace";
import { parseReservationTab } from "./types";

const Page = async ({ searchParams }: { searchParams: Promise<{ tab?: string }> }) => {
  const { tab } = await searchParams;

  return <ReservationsWorkspace initialTab={parseReservationTab(tab)} />;
};

export default Page;
