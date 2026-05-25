import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { fulfillWebhookPayment } from "@/lib/payments";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const limit = await rateLimit(request, "webhook", 120, 60);
    if (!limit.allowed) return rateLimitResponse(60);

    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
    }

    const payload = JSON.parse(body) as {
      event?: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
            status?: string;
            amount?: number;
            currency?: string;
          };
        };
      };
    };

    if (payload.event !== "payment.captured") {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const payment = payload.payload?.payment?.entity;
    const orderId = payment?.order_id;
    const paymentId = payment?.id;
    const amountPaise = payment?.amount;

    if (
      !orderId ||
      !paymentId ||
      payment?.status !== "captured" ||
      typeof amountPaise !== "number" ||
      payment.currency !== "INR"
    ) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    await fulfillWebhookPayment(orderId, paymentId, amountPaise);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, "Webhook processing failed.");
  }
}
