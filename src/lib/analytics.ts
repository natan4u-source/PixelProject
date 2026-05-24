import { promises as fs } from "fs";
import { randomUUID } from "crypto";
import { DATA_DIR, VISITOR_EVENTS_PATH } from "./paths";
import {
  countryLabel,
  getClientIp,
  hashIp,
  normalizeReferrer,
  parseBrowser,
  parseDeviceType,
  resolveGeo,
} from "./visitor-meta";

export type VisitorEvent = {
  id: string;
  ts: string;
  sessionId: string;
  visitorHash: string;
  path: string;
  country: string;
  region: string;
  city: string;
  referrer: string;
  device: "mobile" | "tablet" | "desktop" | "unknown";
  browser: string;
};

export type AnalyticsSummary = {
  totalViews: number;
  uniqueVisitors: number;
  viewsToday: number;
  viewsLast7Days: number;
  topCountries: { country: string; label: string; count: number }[];
  topRegions: { label: string; count: number }[];
  topReferrers: { label: string; count: number }[];
  devices: { label: string; count: number }[];
  browsers: { label: string; count: number }[];
  recent: VisitorEvent[];
};

async function readEvents(): Promise<VisitorEvent[]> {
  try {
    const raw = await fs.readFile(VISITOR_EVENTS_PATH, "utf8");
    const events: VisitorEvent[] = [];
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      try {
        events.push(JSON.parse(line) as VisitorEvent);
      } catch {
        // skip corrupt line
      }
    }
    return events;
  } catch {
    return [];
  }
}

export async function recordVisitorView(input: {
  request: Request;
  sessionId: string;
  path: string;
  referrer: string | null;
}) {
  const ip = getClientIp(input.request);
  const geo = await resolveGeo(input.request, ip);
  const userAgent = input.request.headers.get("user-agent");

  const event: VisitorEvent = {
    id: randomUUID(),
    ts: new Date().toISOString(),
    sessionId: input.sessionId.slice(0, 64),
    visitorHash: hashIp(ip),
    path: input.path.slice(0, 200) || "/",
    country: geo.country,
    region: geo.region,
    city: geo.city,
    referrer: normalizeReferrer(input.referrer),
    device: parseDeviceType(userAgent),
    browser: parseBrowser(userAgent),
  };

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.appendFile(VISITOR_EVENTS_PATH, JSON.stringify(event) + "\n", "utf8");
  return event;
}

function startOfUtcDay(date = new Date()) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function countBy<T extends string>(
  values: T[],
  labelFn: (value: T) => string = (value) => value,
  limit = 8,
) {
  const counts = new Map<string, number>();
  for (const value of values) {
    const label = labelFn(value);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const events = await readEvents();
  const now = Date.now();
  const dayStart = startOfUtcDay();
  const weekStart = now - 7 * 24 * 60 * 60 * 1000;

  const viewsToday = events.filter((event) => Date.parse(event.ts) >= dayStart).length;
  const viewsLast7Days = events.filter((event) => Date.parse(event.ts) >= weekStart).length;
  const uniqueVisitors = new Set(events.map((event) => event.visitorHash)).size;

  const countryCounts = new Map<string, number>();
  for (const event of events) {
    countryCounts.set(event.country, (countryCounts.get(event.country) ?? 0) + 1);
  }
  const topCountries = [...countryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([country, count]) => ({
      country,
      label: countryLabel(country),
      count,
    }));

  const topRegions = countBy(
    events.map((event) => `${event.country}|${event.region}|${event.city}`),
    (key) => {
      const [country, region, city] = key.split("|");
      if (city && city !== "Unknown" && city !== "Local") {
        return `${city}, ${countryLabel(country)}`;
      }
      if (region && region !== "Unknown" && region !== "Local") {
        return `${region}, ${countryLabel(country)}`;
      }
      return countryLabel(country);
    },
  );

  const topReferrers = countBy(events.map((event) => event.referrer));
  const devices = countBy(events.map((event) => event.device));
  const browsers = countBy(events.map((event) => event.browser));

  const recent = [...events].sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts)).slice(0, 20);

  return {
    totalViews: events.length,
    uniqueVisitors,
    viewsToday,
    viewsLast7Days,
    topCountries,
    topRegions,
    topReferrers,
    devices,
    browsers,
    recent,
  };
}
