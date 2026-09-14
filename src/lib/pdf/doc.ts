import type { jsPDF } from "jspdf";

export const PAGE = {
  width: 210,
  height: 297,
  margin: 16,
} as const;

export const CONTENT_WIDTH = PAGE.width - PAGE.margin * 2;

export const INK = {
  heading: [11, 17, 32] as const,
  body: [15, 23, 42] as const,
  muted: [107, 114, 128] as const,
  faint: [156, 163, 175] as const,
  line: [223, 228, 235] as const,
  softLine: [236, 239, 243] as const,
  panel: [248, 250, 252] as const,
  accent: [5, 150, 105] as const,
  white: [255, 255, 255] as const,
};

type Rgb = readonly [number, number, number];

export async function createDoc(): Promise<{ doc: jsPDF; cursor: { y: number } }> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  return { doc, cursor: { y: PAGE.margin } };
}

export function setText(doc: jsPDF, size: number, color: Rgb, bold = false) {
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(size);
  doc.setTextColor(color[0], color[1], color[2]);
}

export function fillRect(doc: jsPDF, x: number, y: number, w: number, h: number, color: Rgb) {
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(x, y, w, h, "F");
}

export function rule(doc: jsPDF, y: number, color: Rgb = INK.softLine, width = 0.2) {
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(width);
  doc.line(PAGE.margin, y, PAGE.width - PAGE.margin, y);
}

export function label(doc: jsPDF, text: string, x: number, y: number, color: Rgb = INK.muted) {
  setText(doc, 7, color, true);
  doc.text(text.toUpperCase(), x, y, { charSpace: 0.4 });
  return y + 4.5;
}

export function detailRow(
  doc: jsPDF,
  y: number,
  labelText: string,
  value: string,
  opts: { x?: number; width?: number } = {},
) {
  const x = opts.x ?? PAGE.margin;
  const width = opts.width ?? CONTENT_WIDTH;

  setText(doc, 8.5, INK.muted);
  doc.text(labelText, x, y);

  setText(doc, 9, INK.body, true);
  const valueLines = doc.splitTextToSize(value || "-", width * 0.62) as string[];
  doc.text(valueLines, x + width, y, { align: "right" });

  const consumed = Math.max(1, valueLines.length) * 4.2;
  doc.setDrawColor(INK.softLine[0], INK.softLine[1], INK.softLine[2]);
  doc.setLineWidth(0.15);
  doc.line(x, y + consumed - 1.4, x + width, y + consumed - 1.4);

  return y + consumed + 1.6;
}

export function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed <= PAGE.height - PAGE.margin) return y;
  doc.addPage();
  return PAGE.margin;
}

export function footer(doc: jsPDF, generatedAt: string) {
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    const y = PAGE.height - 10;
    setText(doc, 7.5, INK.faint);
    doc.text(`Generated ${generatedAt}`, PAGE.margin, y);
    const right = pages > 1 ? `Powered by Dineri  ·  ${page} / ${pages}` : "Powered by Dineri";
    doc.text(right, PAGE.width - PAGE.margin, y, { align: "right" });
  }
}

export async function loadImageData(
  url: string | null | undefined,
): Promise<{ data: string; format: "PNG" | "JPEG" } | null> {
  if (!url) return null;

  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) return null;

    const blob = await response.blob();
    const format = blob.type === "image/png" ? "PNG" : blob.type === "image/jpeg" ? "JPEG" : null;
    if (!format) return null;

    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });

    return { data, format };
  } catch {
    return null;
  }
}

export function drawLogo(
  doc: jsPDF,
  image: { data: string; format: "PNG" | "JPEG" } | null,
  name: string,
  x: number,
  y: number,
  size: number,
) {
  if (image) {
    try {
      doc.addImage(image.data, image.format, x, y, size, size);
      return;
    } catch {
      // fall through to the monogram
    }
  }

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, size, size, 1.6, 1.6, "S");
  setText(doc, size * 0.42, INK.white, true);
  doc.text(name.slice(0, 2).toUpperCase(), x + size / 2, y + size / 2 + size * 0.15, {
    align: "center",
  });
}

export function save(doc: jsPDF, fileName: string) {
  doc.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
}

export function pdfSafe(text: string): string {
  return text
    .replace(/₹/g, "INR ") // rupee
    .replace(/₨/g, "Rs ")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/·/g, "-");
}
