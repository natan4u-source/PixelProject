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

export type ProductListing = {
  id: string;
  name: string;
  description: string;
  priceInr: number;
  unit: string;
  category: "Team Kamal" | "Team Cockroach" | "Digital service";
};

/** Minimum five listings for payment-gateway product-page compliance */
export const PRODUCTS: ProductListing[] = [
  {
    id: "kamal-single-pixel",
    name: "Team Kamal — single pixel",
    description:
      "Buy one pixel on the Kamal canvas. Choose an available coordinate at checkout. The pixel is marked sold and its colour is revealed on the public canvas immediately after payment. Digital service only.",
    priceInr: PRICE_PER_PIXEL_INR,
    unit: "per pixel",
    category: "Team Kamal",
  },
  {
    id: "cockroach-single-pixel",
    name: "Team Cockroach — single pixel",
    description:
      "Buy one pixel on the Cockroach canvas. Choose an available coordinate at checkout. The pixel is marked sold and its colour is revealed on the public canvas immediately after payment. Digital service only.",
    priceInr: PRICE_PER_PIXEL_INR,
    unit: "per pixel",
    category: "Team Cockroach",
  },
  {
    id: "kamal-bulk-pixels",
    name: "Team Kamal — bulk pixels",
    description:
      "Buy multiple pixels on the Kamal canvas in one payment. You choose the quantity at checkout; random unsold coordinates are allocated. All pixels are revealed on the public canvas after payment. Digital service only.",
    priceInr: PRICE_PER_PIXEL_INR,
    unit: "per pixel (quantity chosen at checkout)",
    category: "Team Kamal",
  },
  {
    id: "cockroach-bulk-pixels",
    name: "Team Cockroach — bulk pixels",
    description:
      "Buy multiple pixels on the Cockroach canvas in one payment. You choose the quantity at checkout; random unsold coordinates are allocated. All pixels are revealed on the public canvas after payment. Digital service only.",
    priceInr: PRICE_PER_PIXEL_INR,
    unit: "per pixel (quantity chosen at checkout)",
    category: "Team Cockroach",
  },
  {
    id: "kamal-10-pixel-pack",
    name: "Team Kamal — 10 pixel pack",
    description:
      "Pre-defined bundle of 10 pixels on the Kamal canvas in a single transaction. Ten random unsold coordinates are allocated and revealed after payment. Digital service only.",
    priceInr: PRICE_PER_PIXEL_INR * 10,
    unit: "per pack (10 pixels)",
    category: "Team Kamal",
  },
  {
    id: "cockroach-10-pixel-pack",
    name: "Team Cockroach — 10 pixel pack",
    description:
      "Pre-defined bundle of 10 pixels on the Cockroach canvas in a single transaction. Ten random unsold coordinates are allocated and revealed after payment. Digital service only.",
    priceInr: PRICE_PER_PIXEL_INR * 10,
    unit: "per pack (10 pixels)",
    category: "Team Cockroach",
  },
];

export function operatorLine(): string {
  return `This website is operated by ${BUSINESS_NAME}.`;
}
