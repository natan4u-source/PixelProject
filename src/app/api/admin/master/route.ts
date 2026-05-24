import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/auth";
import { saveMasterImage } from "@/lib/image";
import { ensureDualSideLayout } from "@/lib/layout-migrate";
import { sideFromSearchParams } from "@/lib/side-params";

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

  const form = await request.formData();
  const file = form.get("image");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing image file." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length === 0) {
    return NextResponse.json({ error: "Empty file." }, { status: 400 });
  }

  await saveMasterImage(side, buffer);

  return NextResponse.json({
    ok: true,
    side,
    message: `Hidden image uploaded for Side ${side.toUpperCase()}.`,
  });
}
