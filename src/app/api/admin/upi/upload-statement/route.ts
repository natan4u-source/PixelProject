import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { requireAdmin } from "@/lib/admin-guard";
import {
  parseBankStatementCsv,
  reconcileStatementUpload,
  saveStatementUpload,
} from "@/lib/bank-statement";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Upload a CSV bank statement." }, { status: 400 });
    }

    const text = await file.text();
    const parsed = parseBankStatementCsv(text);
    if (parsed.length === 0) {
      return NextResponse.json(
        {
          error:
            "No UPI credit rows found. Export CSV from your bank with UTR/reference and amount columns.",
        },
        { status: 400 },
      );
    }

    const upload = await saveStatementUpload(file.name, parsed);
    const reconciliation = await reconcileStatementUpload(upload.id);

    return NextResponse.json({
      upload: reconciliation.upload,
      matchedCount: reconciliation.matched.length,
      matched: reconciliation.matched.map((m) => ({
        submissionId: m.submission.id,
        utr: m.submission.utrNormalized,
        amountInr: m.submission.amountInr,
        side: m.submission.side,
        type: m.submission.type,
      })),
      unmatchedSubmissionsCount: reconciliation.unmatchedSubmissions.length,
      unmatchedLinesCount: reconciliation.unmatchedLines.length,
    });
  } catch (err) {
    return apiError(err, "Could not process bank statement.");
  }
}
