"use client";

import { Button } from "@/components/ui/button";
import {
  ReservationPrintableTicket,
  reservationReference,
  TicketReservation,
  TicketRestaurant,
} from "@/components/shared/reservation-ticket";
import { downloadReservationTicketPdf } from "@/lib/pdf/reservation-ticket-pdf";
import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ReservationTicketPage({
  reservation,
}: {
  reservation: TicketReservation & { restaurant: TicketRestaurant };
}) {
  const reference = reservationReference(reservation.id);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadReservationTicketPdf(reservation.restaurant, reservation);
    } catch {
      toast.error("Could not build the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-b from-zinc-50 to-zinc-100 px-4 py-10 text-zinc-900">
      <div className="mx-auto w-full max-w-2xl">
        <div>
          <ReservationPrintableTicket
            restaurant={reservation.restaurant}
            reservation={reservation}
            reference={reference}
          />
        </div>

        <div className="no-print mt-5">
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {downloading ? "Preparing PDF…" : "Download PDF"}
          </Button>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @page { size: A4; margin: 14mm; }
        @media print {
          html, body { margin: 0; padding: 0; background: #ffffff; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          main { background: #ffffff !important; padding: 0 !important; }
        }
      `}</style>
    </main>
  );
}
