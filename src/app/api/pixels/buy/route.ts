import { NextResponse } from "next/server";
import { GRID_HEIGHT, GRID_WIDTH } from "@/lib/config";
import { apiError } from "@/lib/api-error";
import { blockDemoPurchaseWhenPaymentsEnabled } from "@/lib/demo-purchase-guard";
import { purchaseExactPixel } from "@/lib/purchase";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { masterImageExists } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const blocked = blockDemoPurchaseWhenPaymentsEnabled();
    if (blocked) return blocked;

    const limit = await rateLimit(request, "buy", 30, 60);
    if (!limit.allowed) return rateLimitResponse(60);

    if (!(await masterImageExists())) {
      return NextResponse.json(
        { error: "The hidden image has not been uploaded yet." },
        { status: 503 },
      );
    }

  let body: { x?: number; y?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const x = body.x;
  const y = body.y;

  if (
    typeof x !== "number" ||
    typeof y !== "number" ||
    !Number.isInteger(x) ||
    !Number.isInteger(y) ||
    x < 0 ||
    y < 0 ||
    x >= GRID_WIDTH ||
    y >= GRID_HEIGHT
  ) {
    return NextResponse.json({ error: "Invalid pixel coordinates." }, { status: 400 });
  }

    const receipt = await purchaseExactPixel(x, y);
    return NextResponse.json({ receipt });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes("already sold")) {
        return NextResponse.json({ error: err.message }, { status: 409 });
      }
      if (err.message.includes("left to buy")) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
    }
    return apiError(err, "Purchase failed.");
  }
}
