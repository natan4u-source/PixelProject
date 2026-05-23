import { NextResponse } from "next/server";
import { GRID_HEIGHT, GRID_WIDTH, PRICE_PER_PIXEL_INR } from "@/lib/config";
import { isAdminAuthorized } from "@/lib/auth";
import { isPostgresEnabled } from "@/lib/env";
import { ensureSalesMigrated } from "@/lib/migrate-sales";
import { getSoldCountFast } from "@/lib/sales-store";
import { masterImageExists, readMeta } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!isPostgresEnabled()) {
    await ensureSalesMigrated();
  }

  const total = GRID_WIDTH * GRID_HEIGHT;
  const sold = await getSoldCountFast();
  const remaining = total - sold;
  const meta = await readMeta();

  return NextResponse.json({
    grid: { width: GRID_WIDTH, height: GRID_HEIGHT },
    sold,
    remaining,
    total,
    percentRevealed: total > 0 ? (sold / total) * 100 : 0,
    pricePerPixelInr: PRICE_PER_PIXEL_INR,
    revenueInr: sold * PRICE_PER_PIXEL_INR,
    imageReady: await masterImageExists(),
    imageUploadedAt: meta?.uploadedAt ?? null,
  });
}
