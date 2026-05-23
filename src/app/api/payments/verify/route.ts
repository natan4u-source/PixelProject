import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { verifyAndFulfillPayment } from "@/lib/payments";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const limit = await rateLimit(request, "payment-verify", 30, 60);
    if (!limit.allowed) return rateLimitResponse(60);

    let body: {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const razorpayOrderId = body.razorpay_order_id;
    const razorpayPaymentId = body.razorpay_payment_id;
    const razorpaySignature = body.razorpay_signature;

    if (
      typeof razorpayOrderId !== "string" ||
      typeof razorpayPaymentId !== "string" ||
      typeof razorpaySignature !== "string"
    ) {
      return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
    }

    const receipt = await verifyAndFulfillPayment({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    return NextResponse.json({ receipt });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes("verification failed")) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      if (
        err.message.includes("already sold") ||
        err.message.includes("left to buy") ||
        err.message.includes("sold out") ||
        err.message.includes("not found")
      ) {
        return NextResponse.json({ error: err.message }, { status: 409 });
      }
    }
    return apiError(err, "Payment verification failed.");
  }
}
