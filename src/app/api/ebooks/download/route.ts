import { createReadStream } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { EBOOK_PDF_FILES, getEbookPdfPath } from "@/lib/ebooks";
import {
  findEbookPurchaseByToken,
  isDownloadTokenValid,
} from "@/lib/ebook-purchases";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const limit = await rateLimit(request, "ebook-download", 40, 60);
    if (!limit.allowed) return rateLimitResponse(60);

    const token = new URL(request.url).searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Missing download token." }, { status: 400 });
    }

    const purchase = await findEbookPurchaseByToken(token);
    if (!purchase) {
      return NextResponse.json({ error: "Invalid or expired download link." }, { status: 404 });
    }

    if (!isDownloadTokenValid(purchase)) {
      return NextResponse.json(
        { error: "Download link expired. Contact support with your order id." },
        { status: 410 },
      );
    }

    const filename = EBOOK_PDF_FILES[purchase.productId];
    if (!filename) {
      return NextResponse.json({ error: "Ebook file not found." }, { status: 404 });
    }

    const pdfPath = getEbookPdfPath(purchase.productId);
    if (!pdfPath) {
      return NextResponse.json({ error: "Ebook file not found." }, { status: 404 });
    }

    const stream = createReadStream(pdfPath);
    const safeName = path.basename(filename);

    return new NextResponse(stream as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    return apiError(err, "Download failed.");
  }
}
