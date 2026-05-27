export const GRID_WIDTH = 1000;
export const GRID_HEIGHT = 1000;
export const PRICE_PER_PIXEL_INR = 50;

export const SITE_NAME = "kamalvscockroach.com";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || `https://${SITE_NAME}`;

/** Legal / contact — set in env for public pages */
export const BUSINESS_NAME =
  process.env.NEXT_PUBLIC_BUSINESS_NAME?.trim() || "Ninetyone Software Solutions";
export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "kamalvscockroach@gmail.com";
