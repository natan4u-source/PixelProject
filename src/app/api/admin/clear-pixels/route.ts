import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/auth";
import { ensureDualSideLayout } from "@/lib/layout-migrate";
import { sideFromSearchParams } from "@/lib/side-params";
import { clearAllSales } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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

  await clearAllSales(side);

  return NextResponse.json({
    ok: true,
    side,
    message: `Side ${side.toUpperCase()} reset. All sold pixels and purchase history cleared.`,
  });
}
