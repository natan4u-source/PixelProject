import { NextResponse } from "next/server";
import { GRID_HEIGHT, GRID_WIDTH, PRICE_PER_PIXEL_INR } from "@/lib/config";
import { apiError } from "@/lib/api-error";
import {
  getCachedStatus,
  setCachedStatus,
} from "@/lib/cache";
import {
  getActivePaymentProvider,
  getCashfreeEnv,
  getStatusCacheTtlSec,
  isPaymentsEnabled,
  isPostgresEnabled,
} from "@/lib/env";
import { ensureDualSideLayout } from "@/lib/layout-migrate";
import { ensureSalesMigrated } from "@/lib/migrate-sales";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getSoldCountFast } from "@/lib/sales-store";
import { masterImageExists, readMeta } from "@/lib/store";
import { revealedImageExists } from "@/lib/revealed-image";
import type { CanvasSide } from "@/lib/sides";
import { sideFromSearchParams } from "@/lib/side-params";
import { VOTING_END_ISO, isVotingOpen } from "@/lib/voting";

export const dynamic = "force-dynamic";

async function buildSideStatus(side: CanvasSide) {
  if (!isPostgresEnabled()) {
    await ensureSalesMigrated(side);
  }

  const meta = await readMeta(side);
  const sold = await getSoldCountFast(side);
  const total = GRID_WIDTH * GRID_HEIGHT;

  return {
    side,
    ready: await masterImageExists(side),
    grid: { width: GRID_WIDTH, height: GRID_HEIGHT },
    meta,
    sold,
    total,
    remaining: total - sold,
    pricePerPixelInr: PRICE_PER_PIXEL_INR,
    revealedReady: sold > 0 ? await revealedImageExists(side) : false,
  };
}

export async function GET(request: Request) {
  try {
    const limit = await rateLimit(request, "status", 120, 60);
    if (!limit.allowed) return rateLimitResponse(30);

    await ensureDualSideLayout();

    const url = new URL(request.url);
    const showAll = url.searchParams.get("all") === "true";

    if (showAll) {
      const sides: Record<CanvasSide, Awaited<ReturnType<typeof buildSideStatus>>> = {
        a: await buildSideStatus("a"),
        b: await buildSideStatus("b"),
      };

      const body = JSON.stringify({
        sides,
        paymentsEnabled: isPaymentsEnabled(),
        paymentProvider: getActivePaymentProvider(),
        cashfreeEnv: getCashfreeEnv(),
      });

      return new NextResponse(body, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": `public, s-maxage=${getStatusCacheTtlSec()}, stale-while-revalidate=30`,
        },
      });
    }

    const side = sideFromSearchParams(url.searchParams);

    const cached = await getCachedStatus(side);
    if (cached) {
      return new NextResponse(cached, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": `public, s-maxage=${getStatusCacheTtlSec()}, stale-while-revalidate=30`,
        },
      });
    }

    const status = await buildSideStatus(side);
    const body = JSON.stringify({
      ...status,
      paymentsEnabled: isPaymentsEnabled(),
      paymentProvider: getActivePaymentProvider(),
      cashfreeEnv: getCashfreeEnv(),
      votingOpen: isVotingOpen(),
      votingEndsAt: VOTING_END_ISO,
    });

    await setCachedStatus(side, body);

    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": `public, s-maxage=${getStatusCacheTtlSec()}, stale-while-revalidate=30`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Invalid side")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return apiError(error);
  }
}
