import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { getRevealedCacheMaxAgeSec, isPostgresEnabled } from "@/lib/env";
import { ensureSalesMigrated } from "@/lib/migrate-sales";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getRevealedEtag, setRevealedEtag } from "@/lib/cache";
import { getSoldCountFast } from "@/lib/sales-store";
import { REVEALED_IMAGE_PATH, revealedImageExists } from "@/lib/revealed-image";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limit = await rateLimit(request, "revealed", 300, 60);
  if (!limit.allowed) return rateLimitResponse(30);

  if (!isPostgresEnabled()) {
    await ensureSalesMigrated();
  }

  if (!(await revealedImageExists())) {
    return new NextResponse(null, { status: 404 });
  }

  const sold = await getSoldCountFast();
  let etag = await getRevealedEtag();
  if (!etag) {
    etag = `"${sold}"`;
    await setRevealedEtag(etag);
  }

  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch && ifNoneMatch === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": `public, max-age=${getRevealedCacheMaxAgeSec()}, stale-while-revalidate=300`,
      },
    });
  }

  const buffer = await fs.readFile(REVEALED_IMAGE_PATH);
  const maxAge = getRevealedCacheMaxAgeSec();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/png",
      ETag: etag,
      "Cache-Control": `public, max-age=${maxAge}, stale-while-revalidate=300`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
