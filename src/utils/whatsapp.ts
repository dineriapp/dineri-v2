const MIN_DIGITS = 8;
const MAX_DIGITS = 15;

const SEPARATORS = /[\s()./-]/g;

export function normaliseWhatsappNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const trimmed = raw.trim().replace(SEPARATORS, "");
  const digits = trimmed.startsWith("+") ? trimmed.slice(1) : trimmed;

  if (!/^\d+$/.test(digits)) return null;
  if (digits.startsWith("0")) return null;
  if (digits.length < MIN_DIGITS || digits.length > MAX_DIGITS) return null;

  return digits;
}

export function whatsappUrl(raw: string | null | undefined): string | null {
  const digits = normaliseWhatsappNumber(raw);
  return digits ? `https://wa.me/${digits}` : null;
}
