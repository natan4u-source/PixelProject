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
  category: "Team Kamal" | "Team Cockroach" | "Digital service" | "Ebook";
};

export const EBOOK_PRICE_INR = 2999;

export type EbookListing = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceInr: number;
  unit: string;
  pages: number;
};

export const EBOOK_SUPPORT_PROMPTS: EbookListing = {
  id: "ebook-support-prompts",
  slug: "customer-support-prompts",
  name: "Customer Support ChatGPT Prompt Pack",
  description:
    "PDF ebook (~10 pages): 100+ copy-paste ChatGPT prompts for payments, UPI issues, refunds, WhatsApp, Instagram DMs, and angry customers. Written for Indian small businesses. Instant digital download.",
  priceInr: EBOOK_PRICE_INR,
  unit: "one-time download",
  pages: 10,
};

export const EBOOK_PIXEL_WAR_PLAYBOOK: EbookListing = {
  id: "ebook-pixel-war-playbook",
  slug: "pixel-war-playbook",
  name: "How to Win the Pixel War",
  description:
    "PDF playbook (~10 pages): choose Team Kamal or Cockroach, single vs bulk pixels, payments, share cards, and deadline strategy for kamalvscockroach.com. Instant digital download.",
  priceInr: EBOOK_PRICE_INR,
  unit: "one-time download",
  pages: 10,
};

export const EBOOK_INSTAGRAM_VIRAL: EbookListing = {
  id: "ebook-instagram-viral-stunt",
  slug: "instagram-viral-stunt",
  name: "Instagram Growth for Viral Stunt Sites",
  description:
    "PDF guide (~10 pages): carousels, Reels scripts, story sequences, captions, hashtags, and WhatsApp loops for competition launches. Instant digital download.",
  priceInr: EBOOK_PRICE_INR,
  unit: "one-time download",
  pages: 10,
};

export const EBOOK_INDIA_DIGITAL_STARTER: EbookListing = {
  id: "ebook-india-digital-starter",
  slug: "india-digital-starter",
  name: "India Digital Product Starter",
  description:
    "PDF starter (~10 pages): Cashfree checkout, Render deploy, 5+ product catalogue compliance, refund copy, and gateway rejection fixes. Instant digital download.",
  priceInr: EBOOK_PRICE_INR,
  unit: "one-time download",
  pages: 10,
};

export const EBOOK_KAMAL_COCKROACH_COPY: EbookListing = {
  id: "ebook-kamal-cockroach-copy",
  slug: "kamal-cockroach-copy",
  name: "Kamal vs Cockroach Copy Toolkit",
  description:
    "PDF toolkit (~10 pages): WhatsApp forwards, Instagram captions, Reels text, comment replies, and 30-day content calendar. Instant digital download.",
  priceInr: EBOOK_PRICE_INR,
  unit: "one-time download",
  pages: 10,
};

export const EBOOKS: EbookListing[] = [
  EBOOK_SUPPORT_PROMPTS,
  EBOOK_PIXEL_WAR_PLAYBOOK,
  EBOOK_INSTAGRAM_VIRAL,
  EBOOK_INDIA_DIGITAL_STARTER,
  EBOOK_KAMAL_COCKROACH_COPY,
];

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
  ...EBOOKS.map((e) => ({
    id: e.id,
    name: e.name,
    description: e.description,
    priceInr: e.priceInr,
    unit: e.unit,
    category: "Ebook" as const,
  })),
];

export function operatorLine(): string {
  return `This website is operated by ${BUSINESS_NAME}.`;
}
