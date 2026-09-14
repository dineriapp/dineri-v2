import { format } from "date-fns";
import { createDoc, footer, INK, PAGE, pdfSafe, save, setText } from "./doc";

export async function downloadOrdersExportPdf(options: {
  headers: string[];
  rows: string[][];
  rangeLabel: string;
  truncated: boolean;
}): Promise<void> {
  const { headers, rows, rangeLabel, truncated } = options;

  const { doc } = await createDoc();
  const autoTable = (await import("jspdf-autotable")).default;

  setText(doc, 15, INK.heading, true);
  doc.text("Orders export", PAGE.margin, PAGE.margin + 4);

  setText(doc, 8.5, INK.muted);
  const meta = `Range: ${rangeLabel}  -  ${rows.length} order${rows.length === 1 ? "" : "s"}`;
  doc.text(pdfSafe(meta), PAGE.margin, PAGE.margin + 10);

  if (truncated) {
    setText(doc, 8.5, INK.accent, true);
    doc.text(
      "Showing the first " + rows.length.toLocaleString() + " matching orders.",
      PAGE.margin,
      PAGE.margin + 15,
    );
  }

  autoTable(doc, {
    head: [headers.map(pdfSafe)],
    body: rows.map((row) => row.map((cell) => pdfSafe(String(cell ?? "")))),
    startY: PAGE.margin + (truncated ? 20 : 15),
    margin: { left: PAGE.margin, right: PAGE.margin, bottom: 18 },
    styles: { fontSize: 8, cellPadding: 2, textColor: [...INK.body], lineColor: [...INK.line] },
    headStyles: {
      fillColor: [...INK.heading],
      textColor: [...INK.white],
      fontSize: 8,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [...INK.panel] },
    theme: "grid",
  });

  footer(doc, format(new Date(), "MMM d, yyyy 'at' HH:mm"));
  save(doc, `orders-${rangeLabel}`);
}
