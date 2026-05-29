export type UpiLinkInput = {
  vpa: string;
  payeeName: string;
  amountInr: number;
  note?: string;
};

/** NPCI UPI query — mode 04 = intent/deep-link (not QR-from-gallery). */
export function buildUpiQueryString(input: UpiLinkInput) {
  const params = new URLSearchParams();
  params.set("pa", input.vpa.trim());
  params.set("pn", input.payeeName.trim().slice(0, 50));
  params.set("am", input.amountInr.toFixed(2));
  params.set("cu", "INR");
  params.set("mode", "04");
  if (input.note) params.set("tn", input.note.trim().slice(0, 80));
  return params.toString();
}

/** Build NPCI-style UPI deep link (opens app chooser on Android). */
export function buildUpiPayUri(input: UpiLinkInput) {
  return `upi://pay?${buildUpiQueryString(input)}`;
}

/** Normalize UTR / UPI reference from user input or bank CSV. */
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
