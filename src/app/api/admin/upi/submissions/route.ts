import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { requireAdmin } from "@/lib/admin-guard";
import { listUpiSubmissions } from "@/lib/upi-submissions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    const statusParam = new URL(request.url).searchParams.get("status");
    const submissions = await listUpiSubmissions({
      status:
        statusParam === "pending" ||
        statusParam === "matched" ||
        statusParam === "fulfilled" ||
        statusParam === "rejected"
          ? statusParam
          : undefined,
      limit: 200,
    });

    return NextResponse.json({ submissions });
  } catch (err) {
    return apiError(err, "Could not load UPI submissions.");
  }
}
