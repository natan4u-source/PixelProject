import { DEFAULT_SIDE, parseSide, type CanvasSide } from "./sides";

export function sideFromSearchParams(
  searchParams: URLSearchParams,
  fallback: CanvasSide = DEFAULT_SIDE,
): CanvasSide {
  return parseSide(searchParams.get("side"), fallback);
}

export function sideFromBody(body: unknown, fallback: CanvasSide = DEFAULT_SIDE): CanvasSide {
  if (body && typeof body === "object" && "side" in body) {
    const raw = (body as { side?: unknown }).side;
    if (typeof raw === "string") {
      return parseSide(raw, fallback);
    }
  }
  return fallback;
}
