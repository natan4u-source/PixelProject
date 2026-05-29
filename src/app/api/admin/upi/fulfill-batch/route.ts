import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { requireAdmin } from "@/lib/admin-guard";
import { fulfillUpiSubmission } from "@/lib/upi-fulfill";
import { listUpiSubmissions } from "@/lib/upi-submissions";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    const matched = (await listUpiSubmissions()).filter((s) => s.status === "matched");
    const results: { submissionId: string; ok: boolean; error?: string; purchaseId?: string }[] = [];

    for (const sub of matched) {
      try {
        const { purchaseId } = await fulfillUpiSubmission(sub.id);
        results.push({ submissionId: sub.id, ok: true, purchaseId });
      } catch (error) {
        results.push({
          submissionId: sub.id,
          ok: false,
          error: error instanceof Error ? error.message : "Failed",
        });
      }
    }

    return NextResponse.json({
      processed: results.length,
      succeeded: results.filter((r) => r.ok).length,
      results,
    });
  } catch (err) {
    return apiError(err, "Batch fulfill failed.");
  }
}
