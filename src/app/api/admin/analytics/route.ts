import { NextResponse } from "next/server";
import { getAnalyticsSummary } from "@/lib/analytics";
import { apiError } from "@/lib/api-error";
import { requireAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    const summary = await getAnalyticsSummary();
    return NextResponse.json(summary);
  } catch (error) {
    return apiError(error, "Could not load analytics.");
  }
}
