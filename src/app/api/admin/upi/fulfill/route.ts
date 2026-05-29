import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { requireAdmin } from "@/lib/admin-guard";
import { fulfillUpiSubmission } from "@/lib/upi-fulfill";
import { updateUpiSubmission } from "@/lib/upi-submissions";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    let body: { submissionId?: string; action?: "fulfill" | "reject"; reason?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const submissionId = body.submissionId;
    if (!submissionId) {
      return NextResponse.json({ error: "Missing submission id." }, { status: 400 });
    }

    if (body.action === "reject") {
      const updated = await updateUpiSubmission(submissionId, {
        status: "rejected",
        rejectReason: body.reason?.trim() || "Rejected by admin",
      });
      if (!updated) {
        return NextResponse.json({ error: "Submission not found." }, { status: 404 });
      }
      return NextResponse.json({ submission: updated });
    }

    const result = await fulfillUpiSubmission(submissionId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Error) {
      if (
        err.message.includes("already sold") ||
        err.message.includes("sold out") ||
        err.message.includes("Already fulfilled")
      ) {
        return NextResponse.json({ error: err.message }, { status: 409 });
      }
    }
    return apiError(err, "Fulfillment failed.");
  }
}
