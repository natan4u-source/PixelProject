import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { validateBulkPurchase, validateSinglePurchase } from "@/lib/payments";
import { createUpiSubmission } from "@/lib/upi-submissions";
import { isUpiPaymentsEnabled } from "@/lib/env";
import { sideFromBody } from "@/lib/side-params";
import { blockWhenVotingClosed } from "@/lib/voting-guard";
import { isValidUtr } from "@/lib/upi-uri";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const limit = await rateLimit(request, "upi-submit", 15, 60);
    if (!limit.allowed) return rateLimitResponse(60);

    const votingBlocked = blockWhenVotingClosed();
    if (votingBlocked) return votingBlocked;

    if (!isUpiPaymentsEnabled()) {
      return NextResponse.json({ error: "UPI payments are not enabled." }, { status: 503 });
    }

    let body: {
      utr?: string;
      side?: string;
      type?: "single" | "bulk";
      x?: number;
      y?: number;
      count?: number;
      contactEmail?: string;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const utr = body.utr?.trim();
    if (!utr || !isValidUtr(utr)) {
      return NextResponse.json(
        { error: "Enter your 12-digit UPI reference number (UTR) from the payment receipt." },
        { status: 400 },
      );
    }

    let side;
    try {
      side = sideFromBody(body);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Pick Team Kamal or Team Cockroach." },
        { status: 400 },
      );
    }

    if (body.type === "single") {
      if (typeof body.x !== "number" || typeof body.y !== "number") {
        return NextResponse.json({ error: "Invalid pixel coordinates." }, { status: 400 });
      }
      await validateSinglePurchase(side, body.x, body.y);
      const submission = await createUpiSubmission({
        utr,
        side,
        type: "single",
        x: body.x,
        y: body.y,
        contactEmail: body.contactEmail,
      });
      return NextResponse.json({ submission });
    }

    if (body.type === "bulk") {
      if (typeof body.count !== "number") {
        return NextResponse.json({ error: "Invalid pixel count." }, { status: 400 });
      }
      await validateBulkPurchase(side, body.count);
      const submission = await createUpiSubmission({
        utr,
        side,
        type: "bulk",
        count: body.count,
        contactEmail: body.contactEmail,
      });
      return NextResponse.json({ submission });
    }

    return NextResponse.json({ error: "Invalid order type." }, { status: 400 });
  } catch (err) {
    if (err instanceof Error) {
      if (
        err.message.includes("already submitted") ||
        err.message.includes("already sold") ||
        err.message.includes("sold out") ||
        err.message.includes("Invalid") ||
        err.message.includes("Enter a whole")
      ) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
    }
    return apiError(err, "Could not save payment claim.");
  }
}
