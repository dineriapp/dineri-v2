"use client";

import {
  getContrast,
  getFontStack,
  getGlassFilter,
  resolvedButtonRadius,
  resolvedSectionRadius,
  SHADOW_MAP,
} from "@/app/(dashboard)/dashboard/(with-sidebar)/appearance/_components/utils";
import {
  RESERVATION_PAYMENT_LABEL as PAYMENT_LABEL,
  RESERVATION_STATUS_LABEL as STATUS_LABEL,
  ReservationPrintableTicket,
  reservationReference,
} from "@/components/shared/reservation-ticket";
import { getCurrencySymbol } from "@/lib/stripe/types";
import { AppearanceSettings, DEFAULT_APPEARANCE } from "@/lib/types/appearnace";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarIcon,
  CheckCircle2,
  Clock,
  Download,
  Mail,
  MapPin,
  Phone,
  Receipt,
  StickyNote,
  User,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { downloadReservationTicketPdf } from "@/lib/pdf/reservation-ticket-pdf";
import { useState } from "react";
import { toast } from "sonner";
import { ReservationSuccessDataType } from "../query";
import { AppearanceBackground } from "@/components/shared/appearance-background";

const ReservationSuccessPage = ({
  slug,
  data,
}: {
  slug: string;
  data: ReservationSuccessDataType;
}) => {
  const { restaurant, reservation } = data;
  const settings: AppearanceSettings = restaurant.appearance_settings ?? DEFAULT_APPEARANCE;
  const font = getFontStack(settings.fontFamily);
  const sectionRadius = resolvedSectionRadius(settings);
  const buttonRadius = resolvedButtonRadius(settings);
  const glassFilter = getGlassFilter(settings.glassBlur);

  const sectionDepth: React.CSSProperties = {
    boxShadow: SHADOW_MAP[settings.sectionShadow ?? "none"],
    backdropFilter: glassFilter,
    WebkitBackdropFilter: glassFilter,
  };
  const buttonDepth: React.CSSProperties = {
    boxShadow: SHADOW_MAP[settings.buttonShadow ?? "none"],
    backdropFilter: glassFilter,
    WebkitBackdropFilter: glassFilter,
  };

  const sectionStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      ...sectionDepth,
      border: `1px solid ${settings.sectionBorderColor}`,
      borderRadius: sectionRadius,
    };
    switch (settings.sectionStyle) {
      case "outline":
        return { ...base, background: "transparent" };
      case "gradient":
        return {
          ...base,
          background: `linear-gradient(135deg, ${settings.sectionBgColor}, ${settings.sectionBgColorTo})`,
        };
      default:
        return { ...base, background: settings.sectionBgColor };
    }
  };

  const primaryButtonStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      ...buttonDepth,
      color: settings.buttonTextColor,
      border: `1px solid ${settings.buttonBorderColor}`,
    };
    switch (settings.buttonStyle) {
      case "outline":
        return { ...base, background: "transparent" };
      case "gradient":
        return {
          ...base,
          background: `linear-gradient(135deg, ${settings.buttonBgColor}, ${settings.buttonBgColorTo})`,
        };
      default:
        return { ...base, background: settings.buttonBgColor };
    }
  };

  const secondaryButtonStyle = (): React.CSSProperties => ({
    color: settings.sectionItemHeadingColor,
    border: `1px solid ${settings.sectionBorderColor}`,
    background: "transparent",
  });

  const HeaderIconStyle: React.CSSProperties = {
    background: settings.sectionIconBgColor,
    color: settings.sectionIconColor,
    border: `1px solid ${settings.sectionIconBorderColor}`,
    borderRadius: `${settings.sectionIconRadiusPx}px`,
  };

  const depositPaid = reservation.paymentStatus === "paid";
  const noDepositRequired = reservation.paymentStatus === "free";

  const heading = depositPaid
    ? "Deposit Successfully Paid"
    : noDepositRequired
      ? "No Deposit Required"
      : (PAYMENT_LABEL[reservation.paymentStatus] ?? "Reservation Received");

  const subMessage = depositPaid
    ? "Payment has been received and your reservation is confirmed."
    : noDepositRequired
      ? "No payment was required for this reservation."
      : "We'll confirm your payment shortly and email you once it's settled.";

  const canDownloadTicket =
    reservation.status === "confirmed" &&
    (reservation.paymentStatus === "paid" || reservation.paymentStatus === "free");

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadReservationTicketPdf(restaurant, reservation);
    } catch {
      toast.error("Could not build the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const reservationDate = (() => {
    try {
      return format(new Date(`${reservation.date}T00:00:00`), "EEEE, MMMM d, yyyy");
    } catch {
      return reservation.date;
    }
  })();
  const reservationTime = reservation.time.slice(0, 5);

  return (
    <div className="relative isolate min-h-screen" style={{ fontFamily: font }}>
      <AppearanceBackground settings={settings} />
      <header
        className="sticky top-0 z-30 backdrop-blur"
        style={{ borderBottom: `1px solid ${settings.sectionBorderColor}` }}
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link
            href={`/r/${slug}`}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition hover:opacity-80"
            style={{ ...sectionStyle(), color: settings.sectionItemHeadingColor }}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to {restaurant.name}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="animate-in fade-in zoom-in-95 flex flex-col items-center text-center duration-500">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={HeaderIconStyle}
          >
            <CheckCircle2 className="h-9 w-9" />
          </span>
          <h1 className="mt-5 text-2xl font-bold" style={{ color: settings.heading_color }}>
            Reservation Confirmed
          </h1>
          <p className="mt-1 text-base font-semibold" style={{ color: settings.text_color }}>
            {heading}
          </p>
          <p
            className="mt-1.5 max-w-sm text-sm"
            style={{ color: settings.text_color, opacity: 0.85 }}
          >
            {subMessage}
          </p>
        </div>

        {/* On-screen ticket */}
        <div className="reservation-ticket mt-8 overflow-hidden rounded-3xl" style={sectionStyle()}>
          <div className="flex items-center justify-between px-5 py-4">
            <div className="min-w-0">
              <div
                className="font-jetbrains-mono text-[10px] uppercase tracking-wider"
                style={{ color: settings.sectionItemTextColor }}
              >
                {restaurant.name}
              </div>
              <div
                className="text-sm font-semibold"
                style={{ color: settings.sectionItemHeadingColor }}
              >
                Reservation Ticket
              </div>
            </div>
            {restaurant.logo?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={restaurant.logo.url}
                alt={restaurant.name}
                className="h-10 w-10 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                style={{
                  background: getContrast(settings.sectionItemHeadingColor),
                  color: settings.sectionItemHeadingColor,
                  border: `1px solid ${settings.sectionBorderColor}`,
                }}
              >
                {restaurant.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div
            className="mx-5"
            style={{ borderTop: `1px dashed ${settings.sectionBorderColor}` }}
          />

          <div className="space-y-1 px-5 py-4">
            <DetailRow
              label="Reference"
              value={reservationReference(reservation.id)}
              icon={Receipt}
              settings={settings}
            />
            <DetailRow
              label="Guest name"
              value={reservation.guestName}
              icon={User}
              settings={settings}
            />
            <DetailRow
              label="Phone"
              value={reservation.guestPhone}
              icon={Phone}
              settings={settings}
            />
            <DetailRow
              label="Email"
              value={reservation.guestEmail}
              icon={Mail}
              settings={settings}
            />
            <DetailRow
              label="Party size"
              value={`${reservation.partySize} guest${reservation.partySize === 1 ? "" : "s"}`}
              icon={Users}
              settings={settings}
            />
            <DetailRow
              label="Date"
              value={reservationDate}
              icon={CalendarIcon}
              settings={settings}
            />
            <DetailRow label="Time" value={reservationTime} icon={Clock} settings={settings} />
            {reservation.area && (
              <DetailRow
                label="Area"
                value={reservation.area.name}
                icon={MapPin}
                settings={settings}
              />
            )}
            <DetailRow
              label="Status"
              value={STATUS_LABEL[reservation.status] ?? reservation.status}
              icon={CheckCircle2}
              settings={settings}
            />
            <DetailRow
              label="Payment"
              value={PAYMENT_LABEL[reservation.paymentStatus] ?? reservation.paymentStatus}
              icon={Receipt}
              settings={settings}
            />
            {reservation.paymentStatus === "paid" && (
              <DetailRow
                label="Deposit amount"
                value={`${getCurrencySymbol(restaurant.stripe?.currency)}${Number(reservation.amount).toFixed(2)}`}
                icon={Receipt}
                settings={settings}
              />
            )}
            {reservation.note && (
              <DetailRow
                label="Notes"
                value={reservation.note}
                icon={StickyNote}
                settings={settings}
                last
              />
            )}
          </div>
        </div>

        {/* Professional printable ticket - hidden on screen, rendered into the PDF */}
        <div className="print-ticket">
          <ReservationPrintableTicket restaurant={restaurant} reservation={reservation} />
        </div>

        {/* Actions */}
        <div className="mt-5 grid grid-cols-1 gap-2.5">
          {canDownloadTicket && (
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:opacity-60"
              style={{ ...primaryButtonStyle(), borderRadius: buttonRadius }}
            >
              <Download className="h-4 w-4" />
              {downloading ? "Preparing PDF…" : "Download ticket (PDF)"}
            </button>
          )}
          <Link
            href={`/r/${slug}/menu`}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition"
            style={{ ...secondaryButtonStyle(), borderRadius: buttonRadius }}
          >
            <UtensilsCrossed className="h-4 w-4" /> View menu
          </Link>
          <Link
            href={`/r/${slug}`}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${canDownloadTicket ? "" : "min-[420px]:col-span-2"}`}
            style={{ ...secondaryButtonStyle(), borderRadius: buttonRadius }}
          >
            Back to {restaurant.name}
          </Link>
        </div>

        {/* What happens next */}
        <div className="mt-5 rounded-3xl p-5" style={sectionStyle()}>
          <h3 className="text-sm font-semibold" style={{ color: settings.sectionItemHeadingColor }}>
            What happens next?
          </h3>
          <ol className="mt-3 space-y-3">
            {[
              "You'll receive a confirmation email shortly with all your reservation details.",
              `We'll have your table ready at ${restaurant.name} for ${reservationTime} on ${reservationDate}.`,
              "Arrive a few minutes early - let the host know your reservation reference if asked.",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{
                    background: settings.sectionInIconBgColor,
                    color: settings.sectionInIconColor,
                    border: `1px solid ${settings.sectionInIconBorderColor}`,
                  }}
                >
                  {i + 1}
                </span>
                <p
                  className="mt-0.5 text-xs leading-relaxed"
                  style={{ color: settings.sectionItemTextColor }}
                >
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </main>

      <style>{`
        @page { size: A4; margin: 14mm; }
        @media screen {
          .print-ticket { display: none; }
        }
        @media print {
          html, body { margin: 0; padding: 0; background: #ffffff; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-ticket { display: block !important; }
          .print-ticket * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
};

export default ReservationSuccessPage;

const DetailRow = ({
  label,
  value,
  icon: Icon,
  settings,
  last,
}: {
  label: string;
  value: string;
  icon?: React.ElementType;
  settings: AppearanceSettings;
  last?: boolean;
}) => (
  <div
    className="flex items-center justify-between gap-4 py-2"
    style={{ borderBottom: last ? "none" : `1px solid ${settings.sectionInIconBorderColor}` }}
  >
    <span
      className="flex items-center gap-1.5 text-xs"
      style={{ color: settings.sectionItemTextColor }}
    >
      {Icon && <Icon className="h-3 w-3" />} {label}
    </span>
    <span
      className="max-w-[60%] truncate text-right text-xs font-medium"
      style={{ color: settings.sectionItemHeadingColor }}
    >
      {value}
    </span>
  </div>
);
