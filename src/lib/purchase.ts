import { GRID_HEIGHT, GRID_WIDTH, PRICE_PER_PIXEL_INR } from "./config";
import { pgInsertPurchase, pgPickRandomUnsoldPixels } from "./db/sales";
import { isPostgresEnabled } from "./env";
import { getPixelColorFromBuffer, loadMasterPixels } from "./image";
import {
  repairSoldBitmapIfNeeded,
  incrementSoldCount,
  ensureSalesMigrated,
} from "./migrate-sales";
import { paintRevealedPixels } from "./revealed-image";
import {
  getSoldCountFast,
  isPixelSoldFast,
  markPixelsSold,
} from "./sales-store";
import {
  isPixelSoldInBitmap,
  loadSoldBitmap,
  markPixelInBitmap,
  saveSoldBitmap,
} from "./sold-bitmap";
import type { CanvasSide } from "./sides";
import { appendSales, type PixelRecord } from "./store";
import { appendPurchase, createPurchaseLog } from "./purchases";

export type PurchaseResult = {
  id: string;
  type: "single" | "bulk";
  purchasedAt: string;
  totalInr: number;
  side: CanvasSide;
  pixels: PixelRecord[];
};

function queueReveal(side: CanvasSide, records: PixelRecord[]) {
  if (records.length === 0) return;
  void paintRevealedPixels(side, records).catch((error) => {
    console.error("Failed to paint revealed pixels:", error);
  });
}

async function finalizeFilePurchase(
  side: CanvasSide,
  type: "single" | "bulk",
  pixels: PixelRecord[],
  totalInr: number,
): Promise<PurchaseResult> {
  const log = createPurchaseLog(type, pixels, totalInr);
  await appendPurchase(side, log);
  return {
    id: log.id,
    type: log.type,
    purchasedAt: log.purchasedAt,
    totalInr: log.totalInr,
    side,
    pixels,
  };
}

function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function pickRandomUnsoldPixels(
  bitmap: Buffer,
  count: number,
): { x: number; y: number }[] {
  const picked: { x: number; y: number }[] = [];
  const pickedKeys = new Set<string>();
  const maxAttempts = Math.max(count * 80, 500);

  for (let attempt = 0; picked.length < count && attempt < maxAttempts; attempt++) {
    const x = randomInt(GRID_WIDTH);
    const y = randomInt(GRID_HEIGHT);
    const key = `${x},${y}`;

    if (pickedKeys.has(key) || isPixelSoldInBitmap(bitmap, x, y)) continue;

    pickedKeys.add(key);
    picked.push({ x, y });
  }

  return picked;
}

export async function purchaseExactPixel(
  side: CanvasSide,
  x: number,
  y: number,
): Promise<PurchaseResult> {
  if (await isPixelSoldFast(side, x, y)) {
    throw new Error("This pixel is already sold.");
  }

  const image = await loadMasterPixels(side);
  const color = getPixelColorFromBuffer(image, x, y);
  const record: PixelRecord = {
    x,
    y,
    color,
    purchasedAt: new Date().toISOString(),
  };

  if (isPostgresEnabled()) {
    const log = await pgInsertPurchase(side, "single", [record], PRICE_PER_PIXEL_INR);
    const soldAfter = await getSoldCountFast(side);
    await markPixelsSold(side, [{ x, y }], soldAfter);
    queueReveal(side, [record]);
    return {
      id: log.id,
      type: log.type,
      purchasedAt: log.purchasedAt,
      totalInr: log.totalInr,
      side,
      pixels: [record],
    };
  }

  await ensureSalesMigrated(side);
  await repairSoldBitmapIfNeeded(side);

  const bitmap = await loadSoldBitmap(side, true);
  if (isPixelSoldInBitmap(bitmap, x, y)) {
    throw new Error("This pixel is already sold.");
  }

  markPixelInBitmap(bitmap, x, y);
  await saveSoldBitmap(side, bitmap);
  await appendSales(side, [record]);
  await incrementSoldCount(side, 1);
  await markPixelsSold(side, [{ x, y }], await getSoldCountFast(side));
  queueReveal(side, [record]);

  return finalizeFilePurchase(side, "single", [record], PRICE_PER_PIXEL_INR);
}

export async function purchasePixelCount(
  side: CanvasSide,
  count: number,
): Promise<PurchaseResult> {
  const image = await loadMasterPixels(side);

  if (isPostgresEnabled()) {
    const coords = await pgPickRandomUnsoldPixels(side, count);
    if (coords.length < count) {
      throw new Error(`Only ${coords.length} pixel(s) left to buy.`);
    }

    const bought: PixelRecord[] = coords.map(({ x, y }) => ({
      x,
      y,
      color: getPixelColorFromBuffer(image, x, y),
      purchasedAt: new Date().toISOString(),
    }));

    const log = await pgInsertPurchase(side, "bulk", bought, count * PRICE_PER_PIXEL_INR);
    const soldAfter = await getSoldCountFast(side);
    await markPixelsSold(side, coords, soldAfter);
    queueReveal(side, bought);

    return {
      id: log.id,
      type: log.type,
      purchasedAt: log.purchasedAt,
      totalInr: log.totalInr,
      side,
      pixels: bought,
    };
  }

  await ensureSalesMigrated(side);
  await repairSoldBitmapIfNeeded(side);

  const bitmap = await loadSoldBitmap(side, true);
  const coords = pickRandomUnsoldPixels(bitmap, count);

  if (coords.length < count) {
    throw new Error(`Only ${coords.length} pixel(s) left to buy.`);
  }

  const bought: PixelRecord[] = coords.map(({ x, y }) => ({
    x,
    y,
    color: getPixelColorFromBuffer(image, x, y),
    purchasedAt: new Date().toISOString(),
  }));

  for (const { x, y } of coords) {
    markPixelInBitmap(bitmap, x, y);
  }

  await saveSoldBitmap(side, bitmap);
  await appendSales(side, bought);
  await incrementSoldCount(side, bought.length);
  await markPixelsSold(side, coords, await getSoldCountFast(side));
  queueReveal(side, bought);

  return finalizeFilePurchase(side, "bulk", bought, count * PRICE_PER_PIXEL_INR);
}
