import {
  RESERVATION_PAYMENT_LABEL,
  RESERVATION_STATUS_LABEL,
  reservationReference,
  type TicketReservation,
  type TicketRestaurant,
} from "@/components/shared/reservation-ticket";
import { getCurrencySymbol } from "@/lib/stripe/types";
import { format } from "date-fns";
import {
  CONTENT_WIDTH,
  createDoc,
  detailRow,
  drawLogo,
  ensureSpace,
  fillRect,
  footer,
  INK,
  label,
  loadImageData,
  PAGE,
  pdfSafe,
  save,
  setText,
} from "./doc";

export async function downloadReservationTicketPdf(
  restaurant: TicketRestaurant,
  reservation: TicketReservation,
): Promise<void> {
  const reference = reservationReference(reservation.id);
  const statusLabel = RESERVATION_STATUS_LABEL[reservation.status] ?? reservation.status;
  const paymentLabel =
    RESERVATION_PAYMENT_LABEL[reservation.paymentStatus] ?? reservation.paymentStatus;
  const currencySymbol = getCurrencySymbol(restaurant.stripe?.currency);

  const parsed = (() => {
    const dt = new Date(`${reservation.date}T00:00:00`);
    return isNaN(dt.getTime()) ? null : dt;
  })();
  const fullDate = parsed ? format(parsed, "EEE, MMM d, yyyy") : reservation.date;
  const heroDate = parsed ? format(parsed, "MMM d") : reservation.date;
  const heroSub = parsed ? format(parsed, "EEE - yyyy") : "";
  const time = reservation.time.slice(0, 5);

  const paid = reservation.paymentStatus === "paid";
  const noDeposit = reservation.paymentStatus === "free";
  const depositValue = paid
    ? `${currencySymbol}${Number(reservation.amount).toFixed(2)}`
    : noDeposit
      ? "Not required"
      : "Pending";

  const { doc } = await createDoc();
  const logo = await loadImageData(restaurant.logo?.url);

  // Header band
  const bandHeight = 26;
  fillRect(doc, 0, 0, PAGE.width, bandHeight, INK.heading);
  drawLogo(doc, logo, restaurant.name, PAGE.margin, 7, 12);

  setText(doc, 13, INK.white, true);
  doc.text(pdfSafe(restaurant.name), PAGE.margin + 16, 13.5);
  setText(doc, 7, [174, 183, 198]);
  doc.text("RESERVATION TICKET", PAGE.margin + 16, 18.5, { charSpace: 0.8 });

  setText(doc, 8.5, [209, 250, 229], true);
  doc.text(pdfSafe(statusLabel).toUpperCase(), PAGE.width - PAGE.margin, 15, { align: "right" });

  let y = bandHeight + 12;

  // Reference + deposit
  const halfWidth = CONTENT_WIDTH / 2;
  label(doc, "Reservation reference", PAGE.margin, y);
  label(doc, "Deposit", PAGE.margin + halfWidth, y);
  y += 4.5;

  setText(doc, 16, INK.heading, true);
  doc.text(reference, PAGE.margin, y, { charSpace: 0.5 });
  doc.text(pdfSafe(depositValue), PAGE.margin + halfWidth, y);
  y += 10;

  // Date / time / party
  const heroHeight = 20;
  fillRect(doc, PAGE.margin, y, CONTENT_WIDTH, heroHeight, INK.panel);
  const third = CONTENT_WIDTH / 3;
  const hero = [
    { head: "Date", big: heroDate, sub: heroSub },
    { head: "Time", big: time, sub: "Arrival" },
    {
      head: "Party",
      big: String(reservation.partySize),
      sub: reservation.partySize === 1 ? "Guest" : "Guests",
    },
  ];
  hero.forEach((cell, index) => {
    const x = PAGE.margin + third * index + 6;
    label(doc, cell.head, x, y + 6);
    setText(doc, 14, INK.heading, true);
    doc.text(pdfSafe(cell.big), x, y + 14);
    setText(doc, 7.5, INK.faint);
    doc.text(pdfSafe(cell.sub), x, y + 18);
  });
  y += heroHeight + 12;

  // Guest
  setText(doc, 8, INK.accent, true);
  doc.text("GUEST", PAGE.margin, y, { charSpace: 0.5 });
  y += 5;
  y = detailRow(doc, y, "Name", pdfSafe(reservation.guestName));
  y = detailRow(doc, y, "Phone", reservation.guestPhone);
  y = detailRow(doc, y, "Email", reservation.guestEmail);
  y += 6;

  // Reservation
  y = ensureSpace(doc, y, 40);
  setText(doc, 8, INK.accent, true);
  doc.text("RESERVATION", PAGE.margin, y, { charSpace: 0.5 });
  y += 5;
  y = detailRow(doc, y, "Date", fullDate);
  y = detailRow(doc, y, "Time", time);
  if (reservation.area) y = detailRow(doc, y, "Area", pdfSafe(reservation.area.name));
  y = detailRow(doc, y, "Party size", String(reservation.partySize));
  y = detailRow(doc, y, "Status", pdfSafe(statusLabel));
  y += 6;

  // Payment
  y = ensureSpace(doc, y, 26);
  setText(doc, 8, INK.accent, true);
  doc.text("PAYMENT", PAGE.margin, y, { charSpace: 0.5 });
  y += 5;
  y = detailRow(doc, y, "Status", pdfSafe(paymentLabel));
  if (paid) {
    y = detailRow(
      doc,
      y,
      "Deposit paid",
      pdfSafe(`${currencySymbol}${Number(reservation.amount).toFixed(2)}`),
    );
  }

  if (reservation.note) {
    y = ensureSpace(doc, y + 6, 24);
    setText(doc, 8, INK.accent, true);
    doc.text("NOTES", PAGE.margin, y, { charSpace: 0.5 });
    y += 5.5;
    setText(doc, 9, INK.muted);
    const noteLines = doc.splitTextToSize(pdfSafe(reservation.note), CONTENT_WIDTH) as string[];
    doc.text(noteLines, PAGE.margin, y);
    y += noteLines.length * 4.4;
  }

  // Arrival stub
  y = ensureSpace(doc, y + 8, 22);
  fillRect(doc, PAGE.margin, y, CONTENT_WIDTH, 16, INK.panel);
  setText(doc, 9, INK.body, true);
  doc.text("Present this reference on arrival", PAGE.margin + 6, y + 7);
  setText(doc, 7.5, INK.faint);
  doc.text("Please arrive a few minutes early.", PAGE.margin + 6, y + 11.5);
  setText(doc, 11, INK.heading, true);
  doc.text(reference, PAGE.width - PAGE.margin - 6, y + 10, { align: "right" });

  footer(doc, format(new Date(), "MMM d, yyyy 'at' HH:mm"));
  save(doc, reference);
}
