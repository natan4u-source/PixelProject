import { NextResponse } from "next/server";
import { getAnalyticsSummary } from "@/lib/analytics";
import { apiError } from "@/lib/api-error";
import { isAdminAuthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    if (!isAdminAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const summary = await getAnalyticsSummary();
    return NextResponse.json(summary);
  } catch (error) {
    return apiError(error, "Could not load analytics.");
  }
}
