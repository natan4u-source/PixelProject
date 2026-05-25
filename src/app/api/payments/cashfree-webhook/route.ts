import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { verifyCashfreeWebhookSignature } from "@/lib/cashfree";
import { fulfillCashfreeWebhookPayment } from "@/lib/payments";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const limit = await rateLimit(request, "webhook", 120, 60);
    if (!limit.allowed) return rateLimitResponse(60);

    const body = await request.text();
    const signature = request.headers.get("x-webhook-signature");
    const timestamp = request.headers.get("x-webhook-timestamp");

    if (!verifyCashfreeWebhookSignature(signature, timestamp, body)) {
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
    }

    const payload = JSON.parse(body) as {
      type?: string;
      data?: {
        order?: { order_id?: string; order_amount?: number };
        payment?: {
          cf_payment_id?: string;
          payment_status?: string;
          payment_amount?: number;
        };
      };
    };

    const eventType = payload.type ?? "";
    const isSuccess =
      eventType === "PAYMENT_SUCCESS_WEBHOOK" ||
      eventType === "PAYMENT_CHARGES_WEBHOOK" ||
      payload.data?.payment?.payment_status === "SUCCESS";

    if (!isSuccess) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const orderId = payload.data?.order?.order_id;
    const paymentId = payload.data?.payment?.cf_payment_id;
    const amountInr =
      payload.data?.order?.order_amount ?? payload.data?.payment?.payment_amount;

    if (!orderId || !paymentId || typeof amountInr !== "number") {
      return NextResponse.json({ ok: true, ignored: true });
    }

    await fulfillCashfreeWebhookPayment(orderId, paymentId, amountInr);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, "Webhook processing failed.");
  }
}
