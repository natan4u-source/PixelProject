import { NextResponse } from "next/server";
import { recordVisitorView } from "@/lib/analytics";
import { apiError } from "@/lib/api-error";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const limit = await rateLimit(request, "analytics-view", 30, 60);
    if (!limit.allowed) return rateLimitResponse(60);

    let body: { sessionId?: string; path?: string; referrer?: string | null };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const sessionId = body.sessionId?.trim();
    if (!sessionId || sessionId.length < 8) {
      return NextResponse.json({ error: "Invalid session." }, { status: 400 });
    }

    await recordVisitorView({
      request,
      sessionId,
      path: typeof body.path === "string" ? body.path : "/",
      referrer: typeof body.referrer === "string" ? body.referrer : null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, "Could not record visit.");
  }
}
