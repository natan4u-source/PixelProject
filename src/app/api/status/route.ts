import { NextResponse } from "next/server";
import { GRID_HEIGHT, GRID_WIDTH, PRICE_PER_PIXEL_INR } from "@/lib/config";
import { apiError } from "@/lib/api-error";
import {
  getCachedStatus,
  setCachedStatus,
} from "@/lib/cache";
import { getStatusCacheTtlSec, getRazorpayKeyId, isPostgresEnabled, isRazorpayEnabled } from "@/lib/env";
import { ensureSalesMigrated } from "@/lib/migrate-sales";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getSoldCountFast } from "@/lib/sales-store";
import { masterImageExists, readMeta } from "@/lib/store";
import { revealedImageExists } from "@/lib/revealed-image";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const limit = await rateLimit(request, "status", 120, 60);
    if (!limit.allowed) return rateLimitResponse(30);

    const cached = await getCachedStatus();
    if (cached) {
      return new NextResponse(cached, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": `public, s-maxage=${getStatusCacheTtlSec()}, stale-while-revalidate=30`,
        },
      });
    }

    if (!isPostgresEnabled()) {
      await ensureSalesMigrated();
    }

    const meta = await readMeta();
    const sold = await getSoldCountFast();
    const total = GRID_WIDTH * GRID_HEIGHT;

    const body = JSON.stringify({
      ready: await masterImageExists(),
      grid: { width: GRID_WIDTH, height: GRID_HEIGHT },
      meta,
      sold,
      total,
      remaining: total - sold,
      pricePerPixelInr: PRICE_PER_PIXEL_INR,
      revealedReady: sold > 0 ? await revealedImageExists() : false,
      paymentsEnabled: isRazorpayEnabled(),
      razorpayKeyId: getRazorpayKeyId(),
    });

    await setCachedStatus(body);

    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": `public, s-maxage=${getStatusCacheTtlSec()}, stale-while-revalidate=30`,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
