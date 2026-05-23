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
import { appendSales, type PixelRecord } from "./store";
import { appendPurchase, createPurchaseLog } from "./purchases";

export type PurchaseResult = {
  id: string;
  type: "single" | "bulk";
  purchasedAt: string;
  totalInr: number;
  pixels: PixelRecord[];
};

function queueReveal(records: PixelRecord[]) {
  if (records.length === 0) return;
  void paintRevealedPixels(records).catch((error) => {
    console.error("Failed to paint revealed pixels:", error);
  });
}

async function finalizeFilePurchase(
  type: "single" | "bulk",
  pixels: PixelRecord[],
  totalInr: number,
): Promise<PurchaseResult> {
  const log = createPurchaseLog(type, pixels, totalInr);
  await appendPurchase(log);
  return {
    id: log.id,
    type: log.type,
    purchasedAt: log.purchasedAt,
    totalInr: log.totalInr,
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
  x: number,
  y: number,
): Promise<PurchaseResult> {
  if (await isPixelSoldFast(x, y)) {
    throw new Error("This pixel is already sold.");
  }

  const image = await loadMasterPixels();
  const color = getPixelColorFromBuffer(image, x, y);
  const record: PixelRecord = {
    x,
    y,
    color,
    purchasedAt: new Date().toISOString(),
  };

  if (isPostgresEnabled()) {
    const log = await pgInsertPurchase("single", [record], PRICE_PER_PIXEL_INR);
    const soldAfter = await getSoldCountFast();
    await markPixelsSold([{ x, y }], soldAfter);
    queueReveal([record]);
    return {
      id: log.id,
      type: log.type,
      purchasedAt: log.purchasedAt,
      totalInr: log.totalInr,
      pixels: [record],
    };
  }

  await ensureSalesMigrated();
  await repairSoldBitmapIfNeeded();

  const bitmap = await loadSoldBitmap(true);
  if (isPixelSoldInBitmap(bitmap, x, y)) {
    throw new Error("This pixel is already sold.");
  }

  markPixelInBitmap(bitmap, x, y);
  await saveSoldBitmap(bitmap);
  await appendSales([record]);
  await incrementSoldCount(1);
  await markPixelsSold([{ x, y }], await getSoldCountFast());
  queueReveal([record]);

  return finalizeFilePurchase("single", [record], PRICE_PER_PIXEL_INR);
}

export async function purchasePixelCount(
  count: number,
): Promise<PurchaseResult> {
  const image = await loadMasterPixels();

  if (isPostgresEnabled()) {
    const coords = await pgPickRandomUnsoldPixels(count);
    if (coords.length < count) {
      throw new Error(`Only ${coords.length} pixel(s) left to buy.`);
    }

    const bought: PixelRecord[] = coords.map(({ x, y }) => ({
      x,
      y,
      color: getPixelColorFromBuffer(image, x, y),
      purchasedAt: new Date().toISOString(),
    }));

    const log = await pgInsertPurchase("bulk", bought, count * PRICE_PER_PIXEL_INR);
    const soldAfter = await getSoldCountFast();
    await markPixelsSold(coords, soldAfter);
    queueReveal(bought);

    return {
      id: log.id,
      type: log.type,
      purchasedAt: log.purchasedAt,
      totalInr: log.totalInr,
      pixels: bought,
    };
  }

  await ensureSalesMigrated();
  await repairSoldBitmapIfNeeded();

  const bitmap = await loadSoldBitmap(true);
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

  await saveSoldBitmap(bitmap);
  await appendSales(bought);
  await incrementSoldCount(bought.length);
  await markPixelsSold(coords, await getSoldCountFast());
  queueReveal(bought);

  return finalizeFilePurchase("bulk", bought, count * PRICE_PER_PIXEL_INR);
}
