import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/auth";
import { clearAllSales } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  await clearAllSales();

  return NextResponse.json({
    ok: true,
    message: "Grid reset. All sold pixels and purchase history cleared.",
  });
}
