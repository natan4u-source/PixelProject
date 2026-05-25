import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { saveMasterImage } from "@/lib/image";
import { isLikelyPng, MAX_MASTER_UPLOAD_BYTES } from "@/lib/upload-limits";
import { ensureDualSideLayout } from "@/lib/layout-migrate";
import { sideFromSearchParams } from "@/lib/side-params";

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

  return NextResponse.json({
    ok: true,
    side,
    message: `Hidden image uploaded for Side ${side.toUpperCase()}.`,
  });
}
