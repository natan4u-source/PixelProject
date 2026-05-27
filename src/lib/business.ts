import { BUSINESS_NAME, PRICE_PER_PIXEL_INR } from "./config";

export const LEGAL_LAST_UPDATED = "23 May 2026";

/** Refund & cancellation timelines (payment gateway compliance) */
export const REFUND_REQUEST_WINDOW_DAYS = 7;
export const REFUND_PROCESSING_BUSINESS_DAYS_MIN = 7;
export const REFUND_PROCESSING_BUSINESS_DAYS_MAX = 10;
export const REFUND_MODE =
  "Refund to the original payment method (UPI, credit/debit card, or net banking) through the payment provider, as per bank and gateway timelines.";

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

export function operatorLine(): string {
  return `This website is operated by ${BUSINESS_NAME}.`;
}
