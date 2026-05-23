import { NextResponse } from "next/server";
import { GRID_HEIGHT, GRID_WIDTH, MAX_BULK_PURCHASE } from "@/lib/config";
import { apiError } from "@/lib/api-error";
import { purchasePixelCount } from "@/lib/purchase";
import { getSoldCountFast } from "@/lib/sales-store";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { masterImageExists } from "@/lib/store";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const limit = await rateLimit(request, "buy-bulk", 10, 60);
    if (!limit.allowed) return rateLimitResponse(60);

    if (!(await masterImageExists())) {      return NextResponse.json(
        { error: "The hidden image has not been uploaded yet." },
        { status: 503 },
      );
    }

    let body: { count?: number };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const count = body.count;

    if (typeof count !== "number" || !Number.isInteger(count) || count < 1) {
      return NextResponse.json(
        { error: "Enter a whole number of pixels (1 or more)." },
        { status: 400 },
      );
    }

    if (count > MAX_BULK_PURCHASE) {
      return NextResponse.json(
        { error: `Maximum ${MAX_BULK_PURCHASE.toLocaleString()} pixels per purchase.` },
        { status: 400 },
      );
    }

    const sold = await getSoldCountFast();
    const remaining = GRID_WIDTH * GRID_HEIGHT - sold;
    if (count > remaining) {
      return NextResponse.json(
        { error: `Only ${remaining.toLocaleString()} pixel(s) are still available.` },
        { status: 400 },
      );
    }

    const receipt = await purchasePixelCount(count);
    return NextResponse.json({ receipt });
  } catch (err) {
    if (err instanceof Error && err.message.includes("left to buy")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return apiError(err, "Purchase failed.");
  }
}
