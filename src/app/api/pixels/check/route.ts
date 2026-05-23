import { NextResponse } from "next/server";
import { GRID_HEIGHT, GRID_WIDTH } from "@/lib/config";
import { isPostgresEnabled } from "@/lib/env";
import { ensureSalesMigrated } from "@/lib/migrate-sales";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { isPixelSoldFast } from "@/lib/sales-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limit = await rateLimit(request, "check", 600, 60);
  if (!limit.allowed) return rateLimitResponse(30);

  const url = new URL(request.url);
  const x = Number(url.searchParams.get("x"));
  const y = Number(url.searchParams.get("y"));

  if (
    !Number.isInteger(x) ||
    !Number.isInteger(y) ||
    x < 0 ||
    y < 0 ||
    x >= GRID_WIDTH ||
    y >= GRID_HEIGHT
  ) {
    return NextResponse.json({ error: "Invalid coordinates." }, { status: 400 });
  }

  if (!isPostgresEnabled()) {
    await ensureSalesMigrated();
  }

  const sold = await isPixelSoldFast(x, y);
  return NextResponse.json(
    { x, y, sold },
    {
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
      },
    },
  );
}
