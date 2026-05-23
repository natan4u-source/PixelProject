import crypto from "crypto";
import Razorpay from "razorpay";
import {
  getRazorpayKeyId,
  getRazorpayKeySecret,
  getRazorpayWebhookSecret,
  isRazorpayEnabled,
} from "./env";

let client: Razorpay | null = null;

export function getRazorpayClient() {
  if (!isRazorpayEnabled()) {
    throw new Error("Razorpay is not configured.");
  }

  if (!client) {
    client = new Razorpay({
      key_id: getRazorpayKeyId()!,
      key_secret: getRazorpayKeySecret()!,
    });
  }

  return client;
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
) {
  const secret = getRazorpayKeySecret();
  if (!secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expected === signature;
}

export function verifyWebhookSignature(body: string, signature: string | null) {
  const secret = getRazorpayWebhookSecret();
  if (!secret || !signature) return false;

  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return expected === signature;
}

export function inrToPaise(amountInr: number) {
  return Math.round(amountInr * 100);
}
