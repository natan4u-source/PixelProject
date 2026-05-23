import { randomUUID } from "crypto";
import {
  GRID_HEIGHT,
  GRID_WIDTH,
  MAX_BULK_PURCHASE,
  PRICE_PER_PIXEL_INR,
} from "./config";
import { getRazorpayKeyId, isRazorpayEnabled } from "./env";
import {
  getPaymentOrderByRazorpayId,
  markPaymentOrderPaid,
  savePaymentOrder,
} from "./payment-orders";
import {
  purchaseExactPixel,
  purchasePixelCount,
  type PurchaseResult,
} from "./purchase";
import { getRazorpayClient, inrToPaise, verifyPaymentSignature } from "./razorpay";
import { getSoldCountFast, isPixelSoldFast } from "./sales-store";

export type CreateOrderInput =
  | { type: "single"; x: number; y: number }
  | { type: "bulk"; count: number };

export function assertRazorpayConfigured() {
  if (!isRazorpayEnabled()) {
    throw new Error("Online payments are not configured yet.");
  }
}

export async function validateSinglePurchase(x: number, y: number) {
  if (
    !Number.isInteger(x) ||
    !Number.isInteger(y) ||
    x < 0 ||
    y < 0 ||
    x >= GRID_WIDTH ||
    y >= GRID_HEIGHT
  ) {
    throw new Error("Invalid pixel coordinates.");
  }

  if (await isPixelSoldFast(x, y)) {
    throw new Error("This pixel is already sold.");
  }

  const sold = await getSoldCountFast();
  const remaining = GRID_WIDTH * GRID_HEIGHT - sold;
  if (remaining <= 0) {
    throw new Error("All pixels are sold out.");
  }
}

export async function validateBulkPurchase(count: number) {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error("Enter a whole number of pixels (1 or more).");
  }

  if (count > MAX_BULK_PURCHASE) {
    throw new Error(`Maximum ${MAX_BULK_PURCHASE.toLocaleString()} pixels per purchase.`);
  }

  const sold = await getSoldCountFast();
  const remaining = GRID_WIDTH * GRID_HEIGHT - sold;
  if (count > remaining) {
    throw new Error(`Only ${remaining.toLocaleString()} pixel(s) are still available.`);
  }
}

function amountForOrder(input: CreateOrderInput) {
  if (input.type === "single") {
    return inrToPaise(PRICE_PER_PIXEL_INR);
  }
  return inrToPaise(input.count * PRICE_PER_PIXEL_INR);
}

export async function createPaymentOrder(input: CreateOrderInput) {
  assertRazorpayConfigured();

  if (input.type === "single") {
    await validateSinglePurchase(input.x, input.y);
  } else {
    await validateBulkPurchase(input.count);
  }

  const amountPaise = amountForOrder(input);
  const internalId = randomUUID();
  const razorpay = getRazorpayClient();

  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: internalId.slice(0, 40),
    notes: {
      type: input.type,
      ...(input.type === "single"
        ? { x: String(input.x), y: String(input.y) }
        : { count: String(input.count) }),
    },
  });

  await savePaymentOrder({
    id: internalId,
    razorpayOrderId: order.id,
    type: input.type,
    x: input.type === "single" ? input.x : undefined,
    y: input.type === "single" ? input.y : undefined,
    count: input.type === "bulk" ? input.count : undefined,
    amountPaise,
  });

  return {
    orderId: order.id,
    amount: amountPaise,
    currency: order.currency,
    keyId: getRazorpayKeyId()!,
  };
}

async function fulfillFromStoredOrder(order: {
  type: "single" | "bulk";
  x?: number;
  y?: number;
  count?: number;
}): Promise<PurchaseResult> {
  if (order.type === "single") {
    if (order.x === undefined || order.y === undefined) {
      throw new Error("Invalid payment order.");
    }
    await validateSinglePurchase(order.x, order.y);
    return purchaseExactPixel(order.x, order.y);
  }

  if (order.count === undefined) {
    throw new Error("Invalid payment order.");
  }
  await validateBulkPurchase(order.count);
  return purchasePixelCount(order.count);
}

export async function verifyAndFulfillPayment(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<PurchaseResult> {
  assertRazorpayConfigured();

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;

  if (
    !verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)
  ) {
    throw new Error("Payment verification failed.");
  }

  const existing = await getPaymentOrderByRazorpayId(razorpayOrderId);
  if (!existing) {
    throw new Error("Payment order not found.");
  }

  if (existing.status === "paid" && existing.receipt) {
    return existing.receipt;
  }

  const receipt = await fulfillFromStoredOrder(existing);
  await markPaymentOrderPaid(razorpayOrderId, razorpayPaymentId, receipt);
  return receipt;
}

export async function fulfillWebhookPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
): Promise<PurchaseResult | null> {
  const existing = await getPaymentOrderByRazorpayId(razorpayOrderId);
  if (!existing) return null;
  if (existing.status === "paid" && existing.receipt) return null;

  const receipt = await fulfillFromStoredOrder(existing);
  await markPaymentOrderPaid(razorpayOrderId, razorpayPaymentId, receipt);
  return receipt;
}
