import { after, NextResponse } from "next/server";
import {
  extractCashfreeWebhookPayment,
  isCashfreePaymentSuccessEvent,
  parseCashfreeWebhookPayload,
  verifyCashfreeWebhookRequest,
} from "@/lib/cashfree-webhook";
import { fulfillCashfreeWebhookPayment } from "@/lib/payments";

export const dynamic = "force-dynamic";

/** Cashfree dashboard "Test" and health checks — must return 200 quickly. */
export async function GET() {
  return NextResponse.json({ ok: true, service: "cashfree-webhook" }, { status: 200 });
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-webhook-signature");
  const timestamp = request.headers.get("x-webhook-timestamp");

  if (!verifyCashfreeWebhookRequest(signature, timestamp, body)) {
    return NextResponse.json(
      { error: "Invalid webhook signature. Check CASHFREE_SECRET_KEY on the server." },
      { status: 401 },
    );
  }

  const payload = parseCashfreeWebhookPayload(body);

  // Acknowledge immediately (Cashfree expects ~200 within 50ms).
  const ack = NextResponse.json({ ok: true }, { status: 200 });

  if (!payload) {
    return ack;
  }

  if (!isCashfreePaymentSuccessEvent(payload)) {
    return ack;
  }

  const payment = extractCashfreeWebhookPayment(payload);
  if (!payment) {
    return ack;
  }

  after(async () => {
    try {
      await fulfillCashfreeWebhookPayment(
        payment.orderId,
        payment.paymentId,
        payment.amountInr,
      );
    } catch (error) {
      console.error("Cashfree webhook fulfillment failed:", error);
    }
  });

  return ack;
}
