import { NextResponse } from "next/server";
import { GRID_HEIGHT, GRID_WIDTH, PRICE_PER_PIXEL_INR } from "@/lib/config";
import { requireAdmin } from "@/lib/admin-guard";
import { isPostgresEnabled } from "@/lib/env";
import { ensureDualSideLayout } from "@/lib/layout-migrate";
import { ensureSalesMigrated } from "@/lib/migrate-sales";
import { getSoldCountFast } from "@/lib/sales-store";
import { masterImageExists, readMeta } from "@/lib/store";
import type { CanvasSide } from "@/lib/sides";
import { sideFromSearchParams } from "@/lib/side-params";

export const dynamic = "force-dynamic";

async function buildAdminStats(side: CanvasSide) {
  if (!isPostgresEnabled()) {
    await ensureSalesMigrated(side);
  }

  const total = GRID_WIDTH * GRID_HEIGHT;
  const sold = await getSoldCountFast(side);
  const remaining = total - sold;
  const meta = await readMeta(side);

  return {
    side,
    grid: { width: GRID_WIDTH, height: GRID_HEIGHT },
    sold,
    remaining,
    total,
    percentRevealed: total > 0 ? (sold / total) * 100 : 0,
    pricePerPixelInr: PRICE_PER_PIXEL_INR,
    revenueInr: sold * PRICE_PER_PIXEL_INR,
    imageReady: await masterImageExists(side),
    imageUploadedAt: meta?.uploadedAt ?? null,
  };
}

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  await ensureDualSideLayout();

  const url = new URL(request.url);
  if (url.searchParams.get("all") === "true") {
    const sides: Record<CanvasSide, Awaited<ReturnType<typeof buildAdminStats>>> = {
      a: await buildAdminStats("a"),
      b: await buildAdminStats("b"),
    };
    return NextResponse.json({ sides });
  }

  let side;
  try {
    side = sideFromSearchParams(url.searchParams);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid side." },
      { status: 400 },
    );
  }

  return NextResponse.json(await buildAdminStats(side));
}
