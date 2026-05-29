import { BUSINESS_NAME } from "./config";
import { getUpiVpa } from "./env";

export const UPI_QR_IMAGE_PATH = "/upi-qr.png";

export function getUpiPayeeName() {
  return process.env.NEXT_PUBLIC_UPI_PAYEE_NAME?.trim() || BUSINESS_NAME;
}

export function getUpiVpaOrThrow() {
  const vpa = getUpiVpa();
  if (!vpa) throw new Error("UPI payments are not configured.");
  return vpa;
}
