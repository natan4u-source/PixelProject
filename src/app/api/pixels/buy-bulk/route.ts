import { NextResponse } from "next/server";
import { GRID_HEIGHT, GRID_WIDTH } from "@/lib/config";
import { apiError } from "@/lib/api-error";
import { blockDemoPurchaseWhenPaymentsEnabled } from "@/lib/demo-purchase-guard";
import { blockCrossOriginMutation } from "@/lib/origin-guard";
import { ensureDualSideLayout } from "@/lib/layout-migrate";
import { purchasePixelCount } from "@/lib/purchase";
import { getSoldCountFast } from "@/lib/sales-store";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { sideFromBody } from "@/lib/side-params";
import { masterImageExists } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const originBlocked = blockCrossOriginMutation(request);
    if (originBlocked) return originBlocked;

    const blocked = blockDemoPurchaseWhenPaymentsEnabled();
    if (blocked) return blocked;

    const limit = await rateLimit(request, "buy-bulk", 10, 60);
    if (!limit.allowed) return rateLimitResponse(60);

    await ensureDualSideLayout();

    let body: { side?: string; count?: number };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    let side;
    try {
      side = sideFromBody(body);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid side." },
        { status: 400 },
      );
    }

    if (!(await masterImageExists(side))) {
      return NextResponse.json(
        { error: "The hidden image has not been uploaded yet for this side." },
        { status: 503 },
      );
    }

    const count = body.count;

    if (typeof count !== "number" || !Number.isInteger(count) || count < 1) {
      return NextResponse.json(
        { error: "Enter a whole number of pixels (1 or more)." },
        { status: 400 },
      );
    }

    const sold = await getSoldCountFast(side);
    const remaining = GRID_WIDTH * GRID_HEIGHT - sold;
    if (count > remaining) {
      return NextResponse.json(
        { error: `Only ${remaining.toLocaleString()} pixel(s) are still available on this side.` },
        { status: 400 },
      );
    }

    const receipt = await purchasePixelCount(side, count);
    return NextResponse.json({ receipt });
  } catch (err) {
    if (err instanceof Error && err.message.includes("left to buy")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return apiError(err, "Purchase failed.");
  }
}
