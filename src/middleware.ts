import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  isLegacyAdminApiPath,
  isLegacyAdminPath,
} from "@/lib/admin-path";

const BLOCKED_PATHS = [
  /^\/data(?:\/|$)/i,
  /\/master\.(?:png|enc)$/i,
  /\/sales\.ndjson$/i,
  /\/purchases\.ndjson$/i,
  /\/sold\.bitmap$/i,
  /\/pixels\.json$/i,
  /\/meta\.json$/i,
  /\/payment-orders\.json$/i,
  /\/visitor-events\.ndjson$/i,
  /\/ebook-purchases\.ndjson$/i,
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (BLOCKED_PATHS.some((pattern) => pattern.test(pathname))) {
    return new NextResponse("Not Found", { status: 404 });
  }

  if (isLegacyAdminPath(pathname) || isLegacyAdminApiPath(pathname)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
