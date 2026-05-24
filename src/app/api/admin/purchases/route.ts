import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/auth";
import { ensureDualSideLayout } from "@/lib/layout-migrate";
import { readPurchases } from "@/lib/purchases";
import { sideFromSearchParams } from "@/lib/side-params";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

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

  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "20", 10) || 20, 1), 100);
  const offset = Math.max(parseInt(url.searchParams.get("offset") ?? "0", 10) || 0, 0);

  const { purchases, total } = await readPurchases(side, { limit, offset });

  return NextResponse.json({
    side,
    purchases,
    total,
    limit,
    offset,
    hasMore: offset + purchases.length < total,
  });
}
