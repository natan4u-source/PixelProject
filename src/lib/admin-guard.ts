import { NextResponse } from "next/server";
import { isAdminAuthorized } from "./auth";
import { rateLimit, rateLimitResponse } from "./rate-limit";

export async function requireAdmin(request: Request): Promise<NextResponse | null> {
  const overall = await rateLimit(request, "admin", 40, 60);
  if (!overall.allowed) return rateLimitResponse(60);

  if (!isAdminAuthorized(request)) {
    const failed = await rateLimit(request, "admin-fail", 10, 900);
    if (!failed.allowed) return rateLimitResponse(900);
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return null;
}
