import { NextResponse } from "next/server";
import { SITE_URL } from "./config";

export function blockCrossOriginMutation(request: Request): NextResponse | null {
  if (process.env.NODE_ENV !== "production") return null;

  const origin = request.headers.get("origin");
  if (!origin) return null;

  const allowed = SITE_URL.replace(/\/$/, "");
  const normalized = origin.replace(/\/$/, "");
  if (normalized === allowed) return null;

  return NextResponse.json({ error: "Forbidden." }, { status: 403 });
}
