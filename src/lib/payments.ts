import { randomUUID } from "crypto";
import {
  BUSINESS_NAME,
  GRID_HEIGHT,
  GRID_WIDTH,
  PRICE_PER_PIXEL_INR,
  SUPPORT_EMAIL,
} from "./config";
import {
  createCashfreeOrder,
  getCashfreeCheckoutMode,
  getSuccessfulCashfreePayment,
  inrToCashfreeAmount,
  paiseToInr,
} from "./cashfree";
import {
  getActivePaymentProvider,
  getRazorpayKeyId,
  isCashfreeEnabled,
  isPaymentsEnabled,
  type PaymentProvider,
} from "./env";
import {
  claimPaymentOrderForFulfillment,
  completePaymentOrderFulfillment,
  getPaymentOrderByRazorpayId,
  releasePaymentOrderClaim,
  savePaymentOrder,
} from "./payment-orders";
import {
  purchaseExactPixel,
  purchasePixelCount,
  type PurchaseResult,
} from "./purchase";
import { getRazorpayClient, inrToPaise, verifyPaymentSignature } from "./razorpay";
import { getSoldCountFast, isPixelSoldFast } from "./sales-store";
import type { CanvasSide } from "./sides";

export type CreateOrderInput =
  | { side: CanvasSide; type: "single"; x: number; y: number }
  | { side: CanvasSide; type: "bulk"; count: number };

export type CreateOrderResponse =
  | {
      provider: "cashfree";
      orderId: string;
      paymentSessionId: string;
      cashfreeMode: "sandbox" | "production";
      amountInr: number;
      currency: "INR";
      side: CanvasSide;
    }
  | {
      provider: "razorpay";
      orderId: string;
      amount: number;
      currency: string;
      keyId: string;
      side: CanvasSide;
    };

export function assertPaymentsConfigured() {
  if (!isPaymentsEnabled()) {
    throw new Error("Online payments are not configured yet.");
  }
}

export function getPaymentProvider(): PaymentProvider | null {
  return getActivePaymentProvider();
}

export async function validateSinglePurchase(side: CanvasSide, x: number, y: number) {
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

  if (await isPixelSoldFast(side, x, y)) {
    throw new Error("This pixel is already sold.");
  }

  const sold = await getSoldCountFast(side);
  const remaining = GRID_WIDTH * GRID_HEIGHT - sold;
  if (remaining <= 0) {
    throw new Error("All pixels are sold out on this side.");
  }
}

export async function validateBulkPurchase(side: CanvasSide, count: number) {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error("Enter a whole number of pixels (1 or more).");
  }

  const sold = await getSoldCountFast(side);
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

async function createCashfreePaymentOrder(
  input: CreateOrderInput,
  amountPaise: number,
  internalId: string,
): Promise<CreateOrderResponse> {
  const cf = await createCashfreeOrder({
    orderId: internalId,
    amountPaise,
    customerPhone: "9999999999",
    customerEmail: SUPPORT_EMAIL,
    customerName: BUSINESS_NAME,
  });

  await savePaymentOrder({
    id: internalId,
    side: input.side,
    razorpayOrderId: internalId,
    type: input.type,
    x: input.type === "single" ? input.x : undefined,
    y: input.type === "single" ? input.y : undefined,
    count: input.type === "bulk" ? input.count : undefined,
    amountPaise,
  });

  return {
    provider: "cashfree",
    orderId: cf.orderId,
    paymentSessionId: cf.paymentSessionId,
    cashfreeMode: getCashfreeCheckoutMode(),
    amountInr: inrToCashfreeAmount(amountPaise),
    currency: "INR",
    side: input.side,
  };
}

async function createRazorpayPaymentOrder(
  input: CreateOrderInput,
  amountPaise: number,
  internalId: string,
): Promise<CreateOrderResponse> {
  const razorpay = getRazorpayClient();

  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: internalId.slice(0, 40),
    notes: {
      side: input.side,
      type: input.type,
      ...(input.type === "single"
        ? { x: String(input.x), y: String(input.y) }
        : { count: String(input.count) }),
    },
  });

  await savePaymentOrder({
    id: internalId,
    side: input.side,
    razorpayOrderId: order.id,
    type: input.type,
    x: input.type === "single" ? input.x : undefined,
    y: input.type === "single" ? input.y : undefined,
    count: input.type === "bulk" ? input.count : undefined,
    amountPaise,
  });

  return {
    provider: "razorpay",
    orderId: order.id,
    amount: amountPaise,
    currency: order.currency,
    keyId: getRazorpayKeyId()!,
    side: input.side,
  };
}

export async function createPaymentOrder(input: CreateOrderInput): Promise<CreateOrderResponse> {
  assertPaymentsConfigured();

  if (input.type === "single") {
    await validateSinglePurchase(input.side, input.x, input.y);
  } else {
    await validateBulkPurchase(input.side, input.count);
  }

  const amountPaise = amountForOrder(input);
  const internalId = randomUUID();
  const provider = getActivePaymentProvider();

  if (provider === "cashfree") {
    return createCashfreePaymentOrder(input, amountPaise, internalId);
  }

  return createRazorpayPaymentOrder(input, amountPaise, internalId);
}

async function fulfillFromStoredOrder(order: {
  side: CanvasSide;
  type: "single" | "bulk";
  x?: number;
  y?: number;
  count?: number;
}): Promise<PurchaseResult> {
  if (order.type === "single") {
    if (order.x === undefined || order.y === undefined) {
      throw new Error("Invalid payment order.");
    }
    await validateSinglePurchase(order.side, order.x, order.y);
    return purchaseExactPixel(order.side, order.x, order.y);
  }

  if (order.count === undefined) {
    throw new Error("Invalid payment order.");
  }
  await validateBulkPurchase(order.side, order.count);
  return purchasePixelCount(order.side, order.count);
}

async function fulfillPaymentOrder(
  gatewayOrderId: string,
  gatewayPaymentId: string,
): Promise<PurchaseResult> {
  const claim = await claimPaymentOrderForFulfillment(gatewayOrderId);

  if (claim.kind === "paid") return claim.receipt;
  if (claim.kind === "missing") throw new Error("Payment order not found.");
  if (claim.kind === "busy") {
    throw new Error("Payment is being processed. Try again in a few seconds.");
  }

  const order = claim.order;

  try {
    const receipt = await fulfillFromStoredOrder({
      ...order,
      side: order.side ?? "a",
    });
    await completePaymentOrderFulfillment(gatewayOrderId, gatewayPaymentId, receipt);
    return receipt;
  } catch (error) {
    await releasePaymentOrderClaim(gatewayOrderId);
    throw error;
  }
}

export async function verifyAndFulfillCashfreePayment(orderId: string): Promise<PurchaseResult> {
  if (!isCashfreeEnabled()) {
    throw new Error("Cashfree is not configured.");
  }

  const stored = await getPaymentOrderByRazorpayId(orderId);
  if (!stored) {
    throw new Error("Payment order not found.");
  }

  const payment = await getSuccessfulCashfreePayment(orderId);
  if (!payment) {
    throw new Error("Payment not completed yet. Please wait and try again.");
  }

  const paidPaise = Math.round((payment.amountInr ?? paiseToInr(stored.amountPaise)) * 100);
  if (paidPaise !== stored.amountPaise) {
    throw new Error("Payment amount mismatch.");
  }

  return fulfillPaymentOrder(orderId, payment.paymentId);
}

export async function verifyAndFulfillPayment(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<PurchaseResult> {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;

  if (
    !verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)
  ) {
    throw new Error("Payment verification failed.");
  }

  return fulfillPaymentOrder(razorpayOrderId, razorpayPaymentId);
}

export async function fulfillWebhookPayment(
  gatewayOrderId: string,
  gatewayPaymentId: string,
  amountPaise: number,
): Promise<PurchaseResult | null> {
  const existing = await getPaymentOrderByRazorpayId(gatewayOrderId);
  if (!existing) return null;

  if (existing.amountPaise !== amountPaise) {
    throw new Error("Payment amount mismatch.");
  }

  if (existing.status === "paid" && existing.receipt) return null;

  return fulfillPaymentOrder(gatewayOrderId, gatewayPaymentId);
}

export async function fulfillCashfreeWebhookPayment(
  orderId: string,
  paymentId: string,
  amountInr: number,
): Promise<PurchaseResult | null> {
  const amountPaise = Math.round(amountInr * 100);
  return fulfillWebhookPayment(orderId, paymentId, amountPaise);
}

/** @deprecated Use assertPaymentsConfigured */
export function assertRazorpayConfigured() {
  assertPaymentsConfigured();
}
