import { createHash } from "crypto";

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length > 0) {
      return parts[parts.length - 1]!;
    }
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function hashIp(ip: string) {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export type DeviceType = "mobile" | "tablet" | "desktop" | "unknown";

export function parseDeviceType(userAgent: string | null): DeviceType {
  if (!userAgent) return "unknown";
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android.*mobile|windows phone/.test(ua)) return "mobile";
  if (/mozilla|chrome|safari|firefox|edg/.test(ua)) return "desktop";
  return "unknown";
}

export function parseBrowser(userAgent: string | null) {
  if (!userAgent) return "Unknown";
  if (/edg\//i.test(userAgent)) return "Edge";
  if (/chrome\//i.test(userAgent) && !/edg\//i.test(userAgent)) return "Chrome";
  if (/safari\//i.test(userAgent) && !/chrome\//i.test(userAgent)) return "Safari";
  if (/firefox\//i.test(userAgent)) return "Firefox";
  if (/opr\//i.test(userAgent) || /opera/i.test(userAgent)) return "Opera";
  return "Other";
}

export function normalizeReferrer(referrer: string | null) {
  if (!referrer?.trim()) return "Direct";
  try {
    const url = new URL(referrer);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "Other";
  }
}

export function countryFromHeaders(request: Request) {
  return (
    request.headers.get("cf-ipcountry") ??
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("x-country-code") ??
    null
  );
}

export type GeoLocation = {
  country: string;
  region: string;
  city: string;
};

export async function lookupGeo(ip: string): Promise<GeoLocation> {
  if (ip === "unknown" || ip === "127.0.0.1" || ip.startsWith("::ffff:127.")) {
    return { country: "Local", region: "Local", city: "Local" };
  }

  try {
    const geoip = (await import("geoip-lite")).default;
    const hit = geoip.lookup(ip);
    if (!hit) {
      return { country: "Unknown", region: "Unknown", city: "Unknown" };
    }
    return {
      country: hit.country || "Unknown",
      region: hit.region || "Unknown",
      city: hit.city || "Unknown",
    };
  } catch {
    return { country: "Unknown", region: "Unknown", city: "Unknown" };
  }
}

export async function resolveGeo(request: Request, ip: string): Promise<GeoLocation> {
  const headerCountry = countryFromHeaders(request);
  const geo = await lookupGeo(ip);
  if (headerCountry && geo.country === "Unknown") {
    return { country: headerCountry, region: geo.region, city: geo.city };
  }
  return geo;
}

export function countryLabel(code: string) {
  if (code === "Direct" || code === "Unknown" || code === "Local") return code;
  try {
    const name = new Intl.DisplayNames(["en"], { type: "region" }).of(code);
    return name ? `${name} (${code})` : code;
  } catch {
    return code;
  }
}
