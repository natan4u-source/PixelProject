import { verifyCashfreeWebhookSignature } from "./cashfree";

export type CashfreeWebhookPayload = {
  type?: string;
  event?: string;
  data?: {
    order?: {
      order_id?: string;
      order_amount?: number;
      order_status?: string;
    };
    payment?: {
      cf_payment_id?: string;
      payment_status?: string;
      payment_amount?: number;
    };
  };
};

export function parseCashfreeWebhookPayload(rawBody: string): CashfreeWebhookPayload | null {
  try {
    return JSON.parse(rawBody) as CashfreeWebhookPayload;
  } catch {
    return null;
  }
}

export function isCashfreePaymentSuccessEvent(payload: CashfreeWebhookPayload) {
  const eventType = (payload.type ?? payload.event ?? "").toUpperCase();
  if (eventType.includes("PAYMENT_SUCCESS")) return true;
  if (eventType.includes("SUCCESS") && eventType.includes("PAYMENT")) return true;

  const paymentStatus = payload.data?.payment?.payment_status?.toUpperCase();
  if (paymentStatus === "SUCCESS" || paymentStatus === "PAID") return true;

  const orderStatus = payload.data?.order?.order_status?.toUpperCase();
  return orderStatus === "PAID";
}

export function extractCashfreeWebhookPayment(payload: CashfreeWebhookPayload) {
  const orderId = payload.data?.order?.order_id;
  const paymentId = payload.data?.payment?.cf_payment_id;
  const amountInr =
    payload.data?.order?.order_amount ?? payload.data?.payment?.payment_amount;

  if (!orderId || !paymentId || typeof amountInr !== "number") {
    return null;
  }

  return { orderId, paymentId, amountInr };
}

export function verifyCashfreeWebhookRequest(
  signature: string | null,
  timestamp: string | null,
  rawBody: string,
) {
  return verifyCashfreeWebhookSignature(signature, timestamp, rawBody);
}
