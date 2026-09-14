import type { OrderWithItems, RestaurantType } from "@/drizzle/types";
import { getCurrencySymbol, StripeCurrency } from "@/lib/stripe/types";
import { formatOrderNumber } from "@/lib/utils";
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
  rule,
  save,
  setText,
} from "./doc";

const PAYMENT_STATUS_TEXT: Record<OrderWithItems["paymentStatus"], string> = {
  paid: "Paid",
  pending: "Payment pending",
  failed: "Payment failed",
  refunded: "Refunded",
};

const STATUS_TEXT: Record<OrderWithItems["status"], string> = {
  new: "New",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

type ReceiptOrder = OrderWithItems & {
  restaurant: { name: RestaurantType["name"]; logo: RestaurantType["logo"] };
};

/** Builds and downloads the order receipt as a real PDF. */
export async function downloadOrderReceiptPdf(order: ReceiptOrder): Promise<void> {
  const symbol = getCurrencySymbol(order.currency as StripeCurrency);
  const money = (value: number) => pdfSafe(`${symbol}${value.toFixed(2)}`);

  const restaurantName = order.restaurant?.name || "Restaurant";
  const orderNumber = formatOrderNumber(order.orderNumber);
  const subtotal = Number(order.subtotal) || 0;
  const total = Number(order.total) || 0;
  const fees = Math.max(0, total - subtotal);
  const isDelivery = order.fulfillment === "delivery";

  const { doc } = await createDoc();
  const logo = await loadImageData(order.restaurant?.logo?.url);

  // Header band
  const bandHeight = 26;
  fillRect(doc, 0, 0, PAGE.width, bandHeight, INK.heading);
  drawLogo(doc, logo, restaurantName, PAGE.margin, 7, 12);

  setText(doc, 13, INK.white, true);
  doc.text(pdfSafe(restaurantName), PAGE.margin + 16, 13.5);
  setText(doc, 7, [174, 183, 198]);
  doc.text("ORDER RECEIPT", PAGE.margin + 16, 18.5, { charSpace: 0.8 });

  setText(doc, 8.5, [209, 250, 229], true);
  doc.text(STATUS_TEXT[order.status].toUpperCase(), PAGE.width - PAGE.margin, 15, {
    align: "right",
  });

  let y = bandHeight + 12;

  // Order number + total
  const halfWidth = CONTENT_WIDTH / 2;
  label(doc, "Order", PAGE.margin, y);
  label(
    doc,
    order.paymentStatus === "paid" ? "Total paid" : "Total due",
    PAGE.margin + halfWidth,
    y,
  );
  y += 4.5;

  setText(doc, 16, INK.heading, true);
  doc.text(orderNumber, PAGE.margin, y, { charSpace: 0.5 });
  doc.text(money(total), PAGE.margin + halfWidth, y);
  y += 12;

  // Order details
  y = detailRow(
    doc,
    y,
    isDelivery ? "Delivery" : "Pickup",
    isDelivery ? "To your address" : "Collect in store",
  );
  y = detailRow(doc, y, "Placed", format(new Date(order.createdAt), "PPp"));
  y = detailRow(doc, y, "Payment method", order.paymentReference ? "Card" : "Cash");
  y = detailRow(doc, y, "Payment status", PAYMENT_STATUS_TEXT[order.paymentStatus]);
  if (order.name) y = detailRow(doc, y, "Customer", pdfSafe(order.name));
  if (order.phone) y = detailRow(doc, y, "Phone", order.phone);
  if (order.location) {
    y = detailRow(doc, y, isDelivery ? "Deliver to" : "Location", pdfSafe(order.location));
  }
  y += 8;

  // Items
  y = ensureSpace(doc, y, 24);
  setText(doc, 8, INK.accent, true);
  doc.text("YOUR ORDER", PAGE.margin, y, { charSpace: 0.5 });
  y += 6;

  for (const item of order.items) {
    // Height depends on how many extra lines this item needs.
    const addonText =
      item.addons && item.addons.length > 0
        ? item.addons.map((addon) => addon.label).join(", ")
        : null;
    const needed = 6 + (addonText ? 4 : 0) + (item.customization ? 4 : 0);
    y = ensureSpace(doc, y, needed + 6);

    setText(doc, 9, INK.body, true);
    doc.text(`${item.quantity}x`, PAGE.margin, y);
    const nameLines = doc.splitTextToSize(pdfSafe(item.itemName), CONTENT_WIDTH - 40) as string[];
    doc.text(nameLines, PAGE.margin + 10, y);
    doc.text(money(Number(item.lineTotal)), PAGE.margin + CONTENT_WIDTH, y, { align: "right" });

    let lineY = y + nameLines.length * 4.2;

    if (addonText) {
      setText(doc, 7.5, INK.muted);
      const addonLines = doc.splitTextToSize(pdfSafe(addonText), CONTENT_WIDTH - 45) as string[];
      doc.text(addonLines, PAGE.margin + 10, lineY);
      lineY += addonLines.length * 3.6;
    }

    if (item.customization) {
      setText(doc, 7.5, INK.faint);
      const noteLines = doc.splitTextToSize(
        pdfSafe(`"${item.customization}"`),
        CONTENT_WIDTH - 45,
      ) as string[];
      doc.text(noteLines, PAGE.margin + 10, lineY);
      lineY += noteLines.length * 3.6;
    }

    y = lineY + 3;
  }

  // Totals
  y = ensureSpace(doc, y + 3, 26);
  rule(doc, y);
  y += 7;

  setText(doc, 9, INK.muted);
  doc.text("Subtotal", PAGE.margin, y);
  setText(doc, 9, INK.body);
  doc.text(money(subtotal), PAGE.margin + CONTENT_WIDTH, y, { align: "right" });
  y += 6;

  if (fees > 0.005) {
    setText(doc, 9, INK.muted);
    doc.text("Fees & tax", PAGE.margin, y);
    setText(doc, 9, INK.body);
    doc.text(money(fees), PAGE.margin + CONTENT_WIDTH, y, { align: "right" });
    y += 6;
  }

  rule(doc, y - 1.5);
  y += 4;
  setText(doc, 11, INK.heading, true);
  doc.text(order.paymentStatus === "paid" ? "Total paid" : "Total due", PAGE.margin, y);
  doc.text(money(total), PAGE.margin + CONTENT_WIDTH, y, { align: "right" });

  if (order.email) {
    y = ensureSpace(doc, y + 10, 12);
    setText(doc, 8, INK.faint);
    doc.text(pdfSafe(`A receipt was sent to ${order.email}.`), PAGE.margin, y);
  }

  footer(doc, format(new Date(), "MMM d, yyyy 'at' HH:mm"));
  save(doc, `Order_${order.orderNumber}`);
}
