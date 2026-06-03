import { isValidUtr, normalizeUtr } from "./upi-uri";

/** UPI UTR or Razorpay payment id (pay_…) from receipt */
export function isValidPaymentReference(raw: string): boolean {
  const trimmed = raw.trim();
  if (/^pay_[a-zA-Z0-9]{10,}$/i.test(trimmed)) return true;
  return isValidUtr(trimmed);
}

export function normalizePaymentReference(raw: string): string {
  const trimmed = raw.trim();
  if (/^pay_/i.test(trimmed)) return trimmed.toLowerCase();
  return normalizeUtr(trimmed);
}
