import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/auth";
import { readPurchases } from "@/lib/purchases";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "20", 10) || 20, 1), 100);
  const offset = Math.max(parseInt(url.searchParams.get("offset") ?? "0", 10) || 0, 0);

  const { purchases, total } = await readPurchases({ limit, offset });

  return NextResponse.json({
    purchases,
    total,
    limit,
    offset,
    hasMore: offset + purchases.length < total,
  });
}
