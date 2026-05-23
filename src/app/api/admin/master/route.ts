import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/auth";
import { saveMasterImage } from "@/lib/image";
import { promises as fs } from "fs";
import { DATA_DIR } from "@/lib/paths";

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
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

  await fs.mkdir(DATA_DIR, { recursive: true });
  await saveMasterImage(buffer);

  return NextResponse.json({ ok: true, message: "Hidden image uploaded successfully." });
}
