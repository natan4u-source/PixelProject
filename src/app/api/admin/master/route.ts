import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { saveMasterImage } from "@/lib/image";
import { rebuildAllRevealedFromMaster } from "@/lib/rebuild-revealed";
import { getSoldCountFast } from "@/lib/sales-store";
import { isLikelyPng, MAX_MASTER_UPLOAD_BYTES } from "@/lib/upload-limits";
import { ensureDualSideLayout } from "@/lib/layout-migrate";
import { sideFromSearchParams } from "@/lib/side-params";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

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

  const form = await request.formData();
  const file = form.get("image");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing image file." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length === 0) {
    return NextResponse.json({ error: "Empty file." }, { status: 400 });
  }
  if (buffer.length > MAX_MASTER_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Image too large (max 10 MB)." }, { status: 413 });
  }
  if (!isLikelyPng(buffer)) {
    return NextResponse.json({ error: "Upload a PNG image." }, { status: 400 });
  }

  await saveMasterImage(side, buffer);

  let pixelsRepainted = 0;
  try {
    const sold = await getSoldCountFast(side);
    if (sold > 0) {
      pixelsRepainted = await rebuildAllRevealedFromMaster(side);
    }
  } catch (error) {
    console.error("rebuild after master upload failed:", error);
    return NextResponse.json({
      ok: true,
      side,
      warning: "Master saved but rebuilding revealed pixels failed. Use rebuild-revealed admin API.",
      message: `Hidden image uploaded for Side ${side.toUpperCase()}.`,
    });
  }

  return NextResponse.json({
    ok: true,
    side,
    pixelsRepainted,
    message: `Hidden image uploaded for Side ${side.toUpperCase()}.`,
  });
}
