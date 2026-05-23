import { promises as fs } from "fs";
import { randomUUID } from "crypto";
import { isPostgresEnabled } from "./env";
import { pgReadPurchases } from "./db/sales";
import { DATA_DIR, PURCHASES_LOG_PATH } from "./paths";
import type { PixelRecord } from "./store";

export type PurchaseType = "single" | "bulk";

export type PurchaseLog = {
  id: string;
  type: PurchaseType;
  purchasedAt: string;
  pixelCount: number;
  totalInr: number;
  pixels: Pick<PixelRecord, "x" | "y" | "color">[];
};

export function createPurchaseLog(
  type: PurchaseType,
  pixels: PixelRecord[],
  totalInr: number,
): PurchaseLog {
  return {
    id: randomUUID(),
    type,
    purchasedAt: pixels[0]?.purchasedAt ?? new Date().toISOString(),
    pixelCount: pixels.length,
    totalInr,
    pixels: pixels.map(({ x, y, color }) => ({ x, y, color })),
  };
}

export async function appendPurchase(entry: PurchaseLog) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.appendFile(PURCHASES_LOG_PATH, JSON.stringify(entry) + "\n", "utf8");
}

export async function readPurchases(options: { limit: number; offset: number }) {
  if (isPostgresEnabled()) {
    return pgReadPurchases(options);
  }

  let raw = "";
  try {
    raw = await fs.readFile(PURCHASES_LOG_PATH, "utf8");
  } catch {
    return { purchases: [] as PurchaseLog[], total: 0 };
  }

  const all: PurchaseLog[] = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try {
      all.push(JSON.parse(line) as PurchaseLog);
    } catch {
      // skip corrupt line
    }
  }

  all.reverse();
  const total = all.length;
  const purchases = all.slice(options.offset, options.offset + options.limit);

  return { purchases, total, hasMore: options.offset + purchases.length < total };
}
