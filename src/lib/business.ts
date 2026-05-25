import { BUSINESS_NAME, PRICE_PER_PIXEL_INR } from "./config";

/** Registered address — env overrides defaults for production */
export const BUSINESS_ADDRESS_LINE1 =
  process.env.NEXT_PUBLIC_BUSINESS_ADDRESS?.trim() || "parel house";

export const BUSINESS_ADDRESS_LINE2 =
  process.env.NEXT_PUBLIC_BUSINESS_ADDRESS_LINE2?.trim() || "the village";

export const BUSINESS_CITY =
  process.env.NEXT_PUBLIC_BUSINESS_CITY?.trim() || "kochi";

export const BUSINESS_STATE =
  process.env.NEXT_PUBLIC_BUSINESS_STATE?.trim() || "kerala";

export const BUSINESS_PINCODE =
  process.env.NEXT_PUBLIC_BUSINESS_PINCODE?.trim() || "682308";

export const BUSINESS_PHONE =
  process.env.NEXT_PUBLIC_BUSINESS_PHONE?.trim() || "+91 76785 71962";

export const BUSINESS_GSTIN =
  process.env.NEXT_PUBLIC_BUSINESS_GSTIN?.trim() || "32AUZPA3872H2ZD";

export const LEGAL_LAST_UPDATED = "23 May 2026";

/** Refund & cancellation timelines (Razorpay compliance) */
export const REFUND_REQUEST_WINDOW_DAYS = 7;
export const REFUND_PROCESSING_BUSINESS_DAYS_MIN = 7;
export const REFUND_PROCESSING_BUSINESS_DAYS_MAX = 10;
export const REFUND_MODE =
  "Refund to the original payment method (UPI, credit/debit card, or net banking) through Razorpay, as per bank/Razorpay timelines.";

export const CANCELLATION_WINDOW_MINUTES = 30;
export const DIGITAL_DELIVERY_TIME = "Instant — upon successful payment verification";

export const PRODUCTS = [
  {
    id: "pixel-single",
    name: "Single pixel purchase",
    description:
      "Purchase one pixel coordinate on Canvas A or Canvas B. The pixel is permanently marked as sold and its colour is revealed on the public canvas. Digital service only; no physical goods.",
    priceInr: PRICE_PER_PIXEL_INR,
    unit: "per pixel",
  },
  {
    id: "pixel-bulk",
    name: "Bulk pixel purchase",
    description:
      "Purchase multiple available pixels on one canvas in a single transaction. Random unsold coordinates are allocated. Each pixel is revealed on the public canvas immediately after payment. Digital service only.",
    priceInr: PRICE_PER_PIXEL_INR,
    unit: "per pixel (quantity chosen at checkout)",
  },
] as const;

export function formatBusinessAddress(): string {
  const lines = [BUSINESS_ADDRESS_LINE1, BUSINESS_ADDRESS_LINE2].filter(Boolean);
  const locality = [BUSINESS_CITY, BUSINESS_STATE, BUSINESS_PINCODE].filter(Boolean).join(", ");
  if (locality) lines.push(locality);
  return lines.join("\n");
}

export function businessPhoneTel(): string {
  const digits = BUSINESS_PHONE.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  return BUSINESS_PHONE.replace(/\s/g, "");
}

export function operatorLine(): string {
  return `This website is operated by ${BUSINESS_NAME}.`;
}
