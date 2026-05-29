import { createHmac, timingSafeEqual } from "crypto";
import { SITE_URL } from "./config";
import {
  getCashfreeApiVersion,
  getCashfreeAppId,
  getCashfreeEnv,
  getCashfreeSecret,
  isCashfreeEnabled,
} from "./env";

type CashfreeOrderResponse = {
  order_id?: string;
  payment_session_id?: string;
  order_status?: string;
  order_amount?: number;
  cf_order_id?: string;
};

type CashfreePaymentEntity = {
  cf_payment_id?: string;
  payment_status?: string;
  payment_amount?: number;
};

function assertCashfreeConfigured() {
  if (!isCashfreeEnabled()) {
    throw new Error("Cashfree is not configured.");
  }
}

function cashfreeBaseUrl() {
  return getCashfreeEnv() === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}

function cashfreeHeaders() {
  return {
    "Content-Type": "application/json",
    "x-api-version": getCashfreeApiVersion(),
    "x-client-id": getCashfreeAppId()!,
    "x-client-secret": getCashfreeSecret()!,
  };
}

export function paiseToInr(amountPaise: number) {
  return Math.round(amountPaise) / 100;
}

export function inrToPaise(amountInr: number) {
  return Math.round(amountInr * 100);
}

export function inrToCashfreeAmount(amountPaise: number) {
  return paiseToInr(amountPaise);
}

export async function createCashfreeOrder(input: {
  orderId: string;
  amountPaise: number;
  customerPhone: string;
  customerEmail: string;
  customerName: string;
  returnUrl?: string;
}) {
  assertCashfreeConfigured();

  const phone = input.customerPhone.replace(/\D/g, "");
  const normalizedPhone = phone.length >= 10 ? phone.slice(-10) : "9999999999";

  const res = await fetch(`${cashfreeBaseUrl()}/orders`, {
    method: "POST",
    headers: cashfreeHeaders(),
    body: JSON.stringify({
      order_id: input.orderId,
      order_amount: inrToCashfreeAmount(input.amountPaise),
      order_currency: "INR",
      customer_details: {
        customer_id: input.orderId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 50),
        customer_phone: normalizedPhone,
        customer_email: input.customerEmail,
        customer_name: input.customerName,
      },
      order_meta: {
        return_url: input.returnUrl ?? `${SITE_URL}/?order_id={order_id}`,
        notify_url: `${SITE_URL}/api/payments/cashfree-webhook`,
      },
    }),
  });

  const data = (await res.json()) as CashfreeOrderResponse & {
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.message ?? "Could not create Cashfree order.");
  }

  if (!data.payment_session_id) {
    throw new Error("Cashfree did not return a payment session.");
  }

  return {
    orderId: data.order_id ?? input.orderId,
    paymentSessionId: data.payment_session_id,
    cfOrderId: data.cf_order_id,
  };
}

export async function fetchCashfreeOrder(orderId: string) {
  assertCashfreeConfigured();

  const res = await fetch(`${cashfreeBaseUrl()}/orders/${encodeURIComponent(orderId)}`, {
    headers: cashfreeHeaders(),
  });

  const data = (await res.json()) as CashfreeOrderResponse & { message?: string };
  if (!res.ok) {
    throw new Error(data.message ?? "Could not fetch Cashfree order.");
  }

  return data;
}

export async function fetchCashfreePayments(orderId: string) {
  assertCashfreeConfigured();

  const res = await fetch(
    `${cashfreeBaseUrl()}/orders/${encodeURIComponent(orderId)}/payments`,
    { headers: cashfreeHeaders() },
  );

  const data = (await res.json()) as CashfreePaymentEntity[] | { message?: string };
  if (!res.ok) {
    const message = !Array.isArray(data) && data.message ? data.message : "Could not fetch payments.";
    throw new Error(message);
  }

  return Array.isArray(data) ? data : [];
}

export async function getSuccessfulCashfreePayment(orderId: string) {
  const order = await fetchCashfreeOrder(orderId);
  const payments = await fetchCashfreePayments(orderId);

  const success = payments.find(
    (p) => p.payment_status === "SUCCESS" || p.payment_status === "PAID",
  );

  if (success?.cf_payment_id) {
    return {
      orderId,
      paymentId: success.cf_payment_id,
      orderStatus: order.order_status ?? "PAID",
      amountInr: order.order_amount ?? success.payment_amount,
    };
  }

  if (order.order_status === "PAID") {
    return {
      orderId,
      paymentId: `cf_order_${order.cf_order_id ?? orderId}`,
      orderStatus: order.order_status,
      amountInr: order.order_amount,
    };
  }

  return null;
}

export function verifyCashfreeWebhookSignature(
  signature: string | null,
  timestamp: string | null,
  rawBody: string,
) {
  const secret = getCashfreeSecret();
  if (!secret || !signature || !timestamp) return false;

  const expected = createHmac("sha256", secret)
    .update(timestamp + rawBody)
    .digest("base64");

  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function getCashfreeCheckoutMode() {
  return getCashfreeEnv() === "production" ? "production" : "sandbox";
}
