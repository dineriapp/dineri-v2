import { verifyReservationSuccessToken } from "@/lib/services/reservation-success-token";
import { NO_INDEX } from "@/lib/seo";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import ReservationSuccessPage from "./_components/success-page";
import { getReservationForSuccessPage } from "./query";

export const metadata: Metadata = {
  title: "Reservation confirmed",
  description: "Your reservation confirmation.",
  robots: NO_INDEX,
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ reservationId?: string; t?: string }>;
};

const Page = async ({ params, searchParams }: Props) => {
  const { slug } = await params;
  const { reservationId, t } = await searchParams;
  if (!reservationId || !UUID_RE.test(reservationId)) return notFound();

  if (!verifyReservationSuccessToken(reservationId, t)) return notFound();

  const data = await getReservationForSuccessPage(slug, reservationId);
  if (!data) return notFound();
  return <ReservationSuccessPage slug={slug} data={data} />;
};

export default Page;
