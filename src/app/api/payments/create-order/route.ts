import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { createPaymentOrder } from "@/lib/payments";
import { ensureDualSideLayout } from "@/lib/layout-migrate";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { sideFromBody } from "@/lib/side-params";
import { masterImageExists } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const limit = await rateLimit(request, "payment-create", 20, 60);
    if (!limit.allowed) return rateLimitResponse(60);

    await ensureDualSideLayout();

    let body: {
      side?: string;
      type?: "single" | "bulk";
      x?: number;
      y?: number;
      count?: number;
    };

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

    if (body.type === "single") {
      if (typeof body.x !== "number" || typeof body.y !== "number") {
        return NextResponse.json({ error: "Invalid pixel coordinates." }, { status: 400 });
      }

      const order = await createPaymentOrder({ side, type: "single", x: body.x, y: body.y });
      return NextResponse.json(order);
    }

    if (body.type === "bulk") {
      if (typeof body.count !== "number") {
        return NextResponse.json({ error: "Invalid pixel count." }, { status: 400 });
      }

      const order = await createPaymentOrder({ side, type: "bulk", count: body.count });
      return NextResponse.json(order);
    }

    return NextResponse.json({ error: "Invalid order type." }, { status: 400 });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes("not configured")) {
        return NextResponse.json({ error: err.message }, { status: 503 });
      }
      if (
        err.message.includes("already sold") ||
        err.message.includes("left to buy") ||
        err.message.includes("sold out") ||
        err.message.includes("Invalid") ||
        err.message.includes("Maximum") ||
        err.message.includes("Enter a whole")
      ) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
    }
    return apiError(err, "Could not create payment order.");
  }
}
