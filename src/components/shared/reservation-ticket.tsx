import { UploadedFile } from "@/components/shared/image-uploader";
import { getCurrencySymbol, StripeCurrency } from "@/lib/stripe/types";
import { format } from "date-fns";

export const RESERVATION_STATUS_LABEL: Record<string, string> = {
  pending: "Pending confirmation",
  confirmed: "Confirmed",
  seated: "Seated",
  completed: "Completed",
  no_show: "No show",
  cancelled: "Cancelled",
};

export const RESERVATION_PAYMENT_LABEL: Record<string, string> = {
  free: "No deposit required",
  pending: "Payment pending",
  paid: "Deposit paid",
  failed: "Payment failed",
};

export const reservationReference = (id: string) => `RES-${id.slice(0, 8).toUpperCase()}`;

export type TicketRestaurant = {
  name: string;
  logo?: UploadedFile | null;
  stripe?: { currency?: StripeCurrency | null } | null;
};

export type TicketReservation = {
  id: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  partySize: number;
  date: string;
  time: string;
  amount: string | number;
  paidAmount?: string | number | null;
  refundedAmount?: string | number | null;
  note?: string | null;
  status: string;
  paymentStatus: string;
  area?: { name: string } | null;
};

const TICKET = {
  ink: "#0b1120",
  body: "#0f172a",
  sub: "#334155",
  mute: "#6b7280",
  faint: "#9ca3af",
  line: "#eceff3",
  line2: "#d7dce3",
  softbg: "#f8fafc",
  accent: "#059669",
  accentSoft: "#d1fae5",
  mono: "'SF Mono', ui-monospace, 'Roboto Mono', 'Courier New', monospace",
};

const PLabel = ({ children, color }: { children: React.ReactNode; color?: string }) => (
  <div
    style={{
      fontSize: 9.5,
      fontWeight: 700,
      letterSpacing: "0.15em",
      textTransform: "uppercase",
      color: color ?? TICKET.mute,
    }}
  >
    {children}
  </div>
);

const PSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <div
      style={{
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color: TICKET.accent,
        paddingBottom: 7,
        marginBottom: 4,
        borderBottom: `1.5px solid ${TICKET.accentSoft}`,
      }}
    >
      {title}
    </div>
    {children}
  </div>
);

const PRow = ({ label, value }: { label: string; value: string }) => (
  <div
    style={{
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 16,
      padding: "8px 0",
      borderBottom: `1px solid ${TICKET.line}`,
    }}
  >
    <span style={{ fontSize: 11, color: TICKET.mute, whiteSpace: "nowrap" }}>{label}</span>
    <span
      style={{
        fontSize: 12.5,
        fontWeight: 600,
        color: TICKET.body,
        textAlign: "right",
        wordBreak: "break-word",
      }}
    >
      {value}
    </span>
  </div>
);

export const ReservationPrintableTicket = ({
  restaurant,
  reservation,
  reference = reservationReference(reservation.id),
  statusLabel = RESERVATION_STATUS_LABEL[reservation.status] ?? reservation.status,
  paymentLabel = RESERVATION_PAYMENT_LABEL[reservation.paymentStatus] ?? reservation.paymentStatus,
}: {
  restaurant: TicketRestaurant;
  reservation: TicketReservation;
  reference?: string;
  statusLabel?: string;
  paymentLabel?: string;
}) => {
  const currencySymbol = getCurrencySymbol(restaurant.stripe?.currency);

  let parsed: Date | null = null;
  try {
    const dt = new Date(`${reservation.date}T00:00:00`);
    parsed = isNaN(dt.getTime()) ? null : dt;
  } catch {
    parsed = null;
  }

  const heroDate = parsed ? format(parsed, "MMM d") : reservation.date;
  const heroSub = parsed ? format(parsed, "EEE · yyyy") : "";
  const fullDate = parsed ? format(parsed, "EEE, MMM d, yyyy") : reservation.date;
  const time = reservation.time.slice(0, 5);
  const generatedAt = format(new Date(), "MMM d, yyyy 'at' HH:mm");
  const initials = restaurant.name.slice(0, 2).toUpperCase();
  const paid = reservation.paymentStatus === "paid";
  const noDeposit = reservation.paymentStatus === "free";
  const refundedAmount = Number(reservation.refundedAmount ?? 0);
  const collected = Number(reservation.paidAmount ?? reservation.amount);
  const money = (n: number) => `${currencySymbol}${n.toFixed(2)}`;

  const depositValue = paid
    ? refundedAmount > 0
      ? `${money(collected)} · ${money(refundedAmount)} refunded`
      : money(collected)
    : noDeposit
      ? "Not required"
      : "Pending";

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 680,
        margin: "0 auto",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        color: TICKET.body,
      }}
    >
      <div
        style={{
          border: `1px solid ${TICKET.line2}`,
          borderRadius: 18,
          overflow: "hidden",
          borderTop: `3px solid ${TICKET.accent}`,
          background: "#ffffff",
        }}
      >
        {/* Header band */}
        <div
          style={{
            background: TICKET.ink,
            color: "#ffffff",
            padding: "24px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {restaurant.logo?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={restaurant.logo.url}
                alt={restaurant.name}
                style={{ height: 46, width: 46, borderRadius: 12, objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  height: 46,
                  width: 46,
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                {initials}
              </div>
            )}
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "0.01em" }}>
                {restaurant.name}
              </div>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "#aeb7c6",
                  marginTop: 4,
                }}
              >
                Reservation Ticket
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: "rgba(52,211,153,0.14)",
              border: "1px solid rgba(52,211,153,0.35)",
              borderRadius: 999,
              padding: "6px 14px",
            }}
          >
            <span
              style={{
                height: 7,
                width: 7,
                borderRadius: 999,
                background: "#34d399",
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#d1fae5",
              }}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Summary bar: reference + deposit */}
        <div style={{ display: "flex", borderBottom: `1px solid ${TICKET.line}` }}>
          <div style={{ flex: 1, padding: "20px 32px", borderRight: `1px solid ${TICKET.line}` }}>
            <PLabel>Reservation reference</PLabel>
            <div
              style={{
                marginTop: 9,
                display: "inline-block",
                border: `1px solid ${TICKET.line2}`,
                borderRadius: 9,
                padding: "7px 13px",
                fontFamily: TICKET.mono,
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: TICKET.ink,
                whiteSpace: "nowrap",
              }}
            >
              {reference}
            </div>
          </div>
          <div style={{ width: "38%", padding: "20px 32px", textAlign: "right" }}>
            <PLabel>Deposit</PLabel>
            <div style={{ marginTop: 11, fontSize: 22, fontWeight: 800, color: TICKET.ink }}>
              {depositValue}
            </div>
          </div>
        </div>

        {/* Date / Time / Party hero */}
        <div
          style={{
            display: "flex",
            borderBottom: `1px solid ${TICKET.line}`,
            background: TICKET.softbg,
          }}
        >
          {[
            { label: "Date", big: heroDate, sub: heroSub },
            { label: "Time", big: time, sub: "Arrival" },
            {
              label: "Party",
              big: String(reservation.partySize),
              sub: reservation.partySize === 1 ? "Guest" : "Guests",
            },
          ].map((c, i) => (
            <div
              key={c.label}
              style={{
                flex: 1,
                padding: "18px 32px",
                borderLeft: i === 0 ? "none" : `1px solid ${TICKET.line}`,
              }}
            >
              <PLabel>{c.label}</PLabel>
              <div
                style={{
                  fontSize: 21,
                  fontWeight: 700,
                  marginTop: 6,
                  lineHeight: 1.1,
                  color: TICKET.ink,
                }}
              >
                {c.big}
              </div>
              <div style={{ fontSize: 11, color: TICKET.faint, marginTop: 3 }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Two-column details */}
        <div style={{ display: "flex" }}>
          <div style={{ flex: 1, padding: "22px 32px", borderRight: `1px solid ${TICKET.line}` }}>
            <PSection title="Guest">
              <PRow label="Name" value={reservation.guestName} />
              <PRow label="Phone" value={reservation.guestPhone} />
              <PRow label="Email" value={reservation.guestEmail} />
            </PSection>
          </div>
          <div style={{ flex: 1, padding: "22px 32px" }}>
            <PSection title="Reservation">
              <PRow label="Date" value={fullDate} />
              {reservation.area && <PRow label="Area" value={reservation.area.name} />}
              <PRow label="Status" value={statusLabel} />
            </PSection>
          </div>
        </div>

        <div style={{ padding: "6px 32px 24px", borderTop: `1px solid ${TICKET.line}` }}>
          <div style={{ marginTop: 18 }}>
            <PSection title="Payment">
              <PRow label="Status" value={paymentLabel} />
              {paid && <PRow label="Deposit paid" value={money(collected)} />}
              {refundedAmount > 0 && (
                <>
                  <PRow label="Refunded" value={`−${money(refundedAmount)}`} />
                  <PRow label="Net" value={money(collected - refundedAmount)} />
                </>
              )}
            </PSection>
          </div>

          {reservation.note && (
            <div style={{ marginTop: 18 }}>
              <PSection title="Notes">
                <p style={{ fontSize: 12, lineHeight: 1.65, color: TICKET.sub, margin: "6px 0 0" }}>
                  {reservation.note}
                </p>
              </PSection>
            </div>
          )}
        </div>

        {/* Tear-off stub */}
        <div
          style={{
            borderTop: `2px dashed ${TICKET.line2}`,
            background: TICKET.softbg,
            padding: "15px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: TICKET.body }}>
              Present this reference on arrival
            </div>
            <div style={{ fontSize: 10.5, color: TICKET.faint, marginTop: 2 }}>
              Please arrive a few minutes early.
            </div>
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.05em",
              fontFamily: TICKET.mono,
              color: TICKET.ink,
              border: `1px solid ${TICKET.line2}`,
              borderRadius: 8,
              padding: "6px 11px",
              background: "#ffffff",
              whiteSpace: "nowrap",
            }}
          >
            {reference}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "13px 6px 0",
          fontSize: 10,
          color: TICKET.faint,
        }}
      >
        <span suppressHydrationWarning>Generated {generatedAt}</span>
        <span style={{ letterSpacing: "0.04em" }}>Powered by Dineri</span>
      </div>
    </div>
  );
};
