import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { ensureDualSideLayout } from "@/lib/layout-migrate";
import { sideFromSearchParams } from "@/lib/side-params";
import { clearAllSales } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

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

  await clearAllSales(side);

  return NextResponse.json({
    ok: true,
    side,
    message: `Side ${side.toUpperCase()} reset. All sold pixels and purchase history cleared.`,
  });
}
