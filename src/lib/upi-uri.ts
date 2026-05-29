export type UpiLinkInput = {
  vpa: string;
  payeeName: string;
  amountInr: number;
  note?: string;
  txnRef?: string;
};

/** Short merchant name — long names break some UPI apps. */
export function shortenPayeeName(name: string) {
  const trimmed = name.trim();
  if (trimmed.length <= 24) return trimmed;
  return trimmed.slice(0, 24);
}

export function buildUpiQueryString(input: UpiLinkInput) {
  const params = new URLSearchParams();
  params.set("pa", input.vpa.trim());
  params.set("pn", shortenPayeeName(input.payeeName));
  params.set("am", input.amountInr.toFixed(2));
  params.set("cu", "INR");
  /** 00 = intent / VPA collect (not QR scan — avoids “gallery QR” UI in some apps). */
  params.set("mode", "00");
  params.set("tr", input.txnRef ?? `PX${Date.now()}`);
  if (input.note) params.set("tn", input.note.trim().slice(0, 40));
  return params.toString();
}

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
