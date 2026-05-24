import { NextResponse } from "next/server";
import { GRID_HEIGHT, GRID_WIDTH } from "@/lib/config";
import { isPostgresEnabled } from "@/lib/env";
import { ensureDualSideLayout } from "@/lib/layout-migrate";
import { ensureSalesMigrated } from "@/lib/migrate-sales";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { isPixelSoldFast } from "@/lib/sales-store";
import { sideFromSearchParams } from "@/lib/side-params";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limit = await rateLimit(request, "check", 600, 60);
  if (!limit.allowed) return rateLimitResponse(30);

  await ensureDualSideLayout();

  const url = new URL(request.url);
  let side;
  try {
    side = sideFromSearchParams(url.searchParams);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid side." },
      { status: 400 },
    );
  }

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
    await ensureSalesMigrated(side);
  }

  const sold = await isPixelSoldFast(side, x, y);
  return NextResponse.json(
    { side, x, y, sold },
    {
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
      },
    },
  );
}
