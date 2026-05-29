import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { createEbookPaymentOrder } from "@/lib/payments";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const limit = await rateLimit(request, "payment-create-ebook", 20, 60);
    if (!limit.allowed) return rateLimitResponse(60);

    let body: { productId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const productId = body.productId;
    if (typeof productId !== "string" || !productId) {
      return NextResponse.json({ error: "Missing product id." }, { status: 400 });
    }

    const order = await createEbookPaymentOrder(productId);
    return NextResponse.json(order);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes("not configured")) {
        return NextResponse.json({ error: err.message }, { status: 503 });
      }
      if (
        err.message.includes("Unknown") ||
        err.message.includes("not available") ||
        err.message.includes("Invalid")
      ) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
    }
    return apiError(err, "Could not create ebook payment order.");
  }
}
