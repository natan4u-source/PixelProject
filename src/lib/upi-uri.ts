export type UpiLinkInput = {
  vpa: string;
  payeeName: string;
  amountInr: number;
  note?: string;
};

/**
 * NPCI UPI query for deep links.
 * Omit `mode` — mode=04 triggered “QR from gallery” warnings in PhonePe/GPay.
 * Paytm tolerates links as-is; default push (00) works for VPA collect.
 */
export function buildUpiQueryString(input: UpiLinkInput) {
  const params = new URLSearchParams();
  params.set("pa", input.vpa.trim());
  params.set("pn", input.payeeName.trim().slice(0, 50));
  params.set("am", input.amountInr.toFixed(2));
  params.set("cu", "INR");
  if (input.note) params.set("tn", input.note.trim().slice(0, 80));
  return params.toString();
}

/** Generic UPI chooser (any installed app). */
export function buildUpiPayUri(input: UpiLinkInput) {
  return `upi://pay?${buildUpiQueryString(input)}`;
}

export function normalizeUtr(raw: string): string {
  const cleaned = raw.replace(/\s+/g, "").toUpperCase();
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length >= 12) return digits.slice(-12);
  return cleaned.replace(/[^A-Z0-9]/g, "");
}

export function isValidUtr(raw: string): boolean {
  const n = normalizeUtr(raw);
  return n.length >= 10 && n.length <= 20;
}
