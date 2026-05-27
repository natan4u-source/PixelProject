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
  inrToPaise,
  paiseToInr,
} from "./cashfree";
import { assertCashfreeConfigured, isCashfreeEnabled, isPaymentsEnabled } from "./env";
import {
  claimPaymentOrderForFulfillment,
  completePaymentOrderFulfillment,
  getPaymentOrderByGatewayId,
  getPaymentOrderByPurchaseId,
  releasePaymentOrderClaim,
  savePaymentOrder,
} from "./payment-orders";
import {
  purchaseExactPixel,
  purchasePixelCount,
  type PurchaseResult,
} from "./purchase";
import { getSoldCountFast, isPixelSoldFast } from "./sales-store";
import type { CanvasSide } from "./sides";

export type CreateOrderInput =
  | { side: CanvasSide; type: "single"; x: number; y: number }
  | { side: CanvasSide; type: "bulk"; count: number };

export type CreateOrderResponse = {
  provider: "cashfree";
  orderId: string;
  paymentSessionId: string;
  cashfreeMode: "sandbox" | "production";
  amountInr: number;
  currency: "INR";
  side: CanvasSide;
};

export function assertPaymentsConfigured() {
  if (!isPaymentsEnabled()) {
    throw new Error("Online payments are not configured yet.");
  }
  assertCashfreeConfigured();
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

function enrichReceiptWithCashfree(
  receipt: PurchaseResult,
  cashfreeOrderId: string,
  cashfreePaymentId: string,
): PurchaseResult {
  return {
    ...receipt,
    cashfreeOrderId: receipt.cashfreeOrderId ?? cashfreeOrderId,
    cashfreePaymentId: receipt.cashfreePaymentId ?? cashfreePaymentId,
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
    gatewayOrderId: internalId,
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

  if (claim.kind === "paid") {
    return enrichReceiptWithCashfree(claim.receipt, gatewayOrderId, gatewayPaymentId);
  }
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
    const receiptWithCashfree: PurchaseResult = {
      ...receipt,
      cashfreeOrderId: gatewayOrderId,
      cashfreePaymentId: gatewayPaymentId,
    };
    await completePaymentOrderFulfillment(
      gatewayOrderId,
      gatewayPaymentId,
      receiptWithCashfree,
    );
    return receiptWithCashfree;
  } catch (error) {
    await releasePaymentOrderClaim(gatewayOrderId);
    throw error;
  }
}

export async function verifyAndFulfillCashfreePayment(orderId: string): Promise<PurchaseResult> {
  if (!isCashfreeEnabled()) {
    throw new Error("Cashfree is not configured.");
  }

  const stored = await getPaymentOrderByGatewayId(orderId);
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

  const receipt = await fulfillPaymentOrder(orderId, payment.paymentId);
  return enrichReceiptWithCashfree(receipt, orderId, payment.paymentId);
}

export async function enrichPurchaseReceiptForSupport(
  receipt: PurchaseResult,
): Promise<PurchaseResult> {
  if (receipt.cashfreeOrderId && receipt.cashfreePaymentId) return receipt;
  const order = await getPaymentOrderByPurchaseId(receipt.id);
  if (!order?.gatewayOrderId || !order.gatewayPaymentId) return receipt;
  return enrichReceiptWithCashfree(receipt, order.gatewayOrderId, order.gatewayPaymentId);
}

export async function fulfillWebhookPayment(
  gatewayOrderId: string,
  gatewayPaymentId: string,
  amountPaise: number,
): Promise<PurchaseResult | null> {
  const existing = await getPaymentOrderByGatewayId(gatewayOrderId);
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
