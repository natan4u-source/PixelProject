import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { getRevealedCacheMaxAgeSec, isPostgresEnabled } from "@/lib/env";
import { ensureDualSideLayout } from "@/lib/layout-migrate";
import { ensureSalesMigrated } from "@/lib/migrate-sales";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getRevealedEtag, setRevealedEtag } from "@/lib/cache";
import { getSoldCountFast } from "@/lib/sales-store";
import { revealedImageExists } from "@/lib/revealed-image";
import { revealedImagePath } from "@/lib/paths";
import { sideFromSearchParams } from "@/lib/side-params";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limit = await rateLimit(request, "revealed", 300, 60);
  if (!limit.allowed) return rateLimitResponse(30);

  await ensureDualSideLayout();

  const url = new URL(request.url);
  let side;
  try {
    side = sideFromSearchParams(url.searchParams);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid side." },
      { status: 400 },
    );
  }

  if (!isPostgresEnabled()) {
    await ensureSalesMigrated(side);
  }

  if (!(await revealedImageExists(side))) {
    return new NextResponse(null, { status: 404 });
  }

  const sold = await getSoldCountFast(side);
  let etag = await getRevealedEtag(side);
  if (!etag) {
    etag = `"${side}-${sold}"`;
    await setRevealedEtag(side, etag);
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

  const buffer = await fs.readFile(revealedImagePath(side));
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
