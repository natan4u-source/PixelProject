import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { rebuildAllRevealedFromMaster } from "@/lib/rebuild-revealed";
import { sideFromSearchParams } from "@/lib/side-params";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

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

  try {
    const count = await rebuildAllRevealedFromMaster(side);
    return NextResponse.json({
      ok: true,
      side,
      pixelsRepainted: count,
      message: `Rebuilt revealed image for side ${side.toUpperCase()} (${count.toLocaleString()} pixels).`,
    });
  } catch (error) {
    console.error("rebuild-revealed failed:", error);
    return NextResponse.json(
      {
        error: "Rebuild failed.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
