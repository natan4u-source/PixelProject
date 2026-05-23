import { createReadStream, type ReadStream } from "fs";
import { createInterface } from "readline";
import { GRID_HEIGHT, GRID_WIDTH } from "./config";
import { PIXELS_PATH, SALES_LOG_PATH } from "./paths";
import { promises as fs } from "fs";
import { paintRevealedPixels } from "./revealed-image";
import {
  BITMAP_BYTE_SIZE,
  countSoldInBitmap,
  createEmptyBitmap,
  invalidateBitmapCache,
  isPixelSoldInBitmap,
  loadSoldBitmap,
  markPixelInBitmap,
  saveSoldBitmap,
  TOTAL_PIXELS,
} from "./sold-bitmap";
import path from "path";
import { DATA_DIR } from "./paths";
import type { PixelRecord } from "./store";

const BITMAP_PATH = path.join(DATA_DIR, "sold.bitmap");
const MIGRATED_FLAG = path.join(DATA_DIR, ".migrated");
const SOLD_COUNT_PATH = path.join(DATA_DIR, "sold.count");

let migrationPromise: Promise<void> | null = null;
let repairPromise: Promise<void> | null = null;

export function resetSalesRuntimeCache() {
  migrationPromise = null;
  repairPromise = null;
  invalidateBitmapCache();
}

async function streamNdjson(
  filePath: string,
  onRecord: (r: PixelRecord) => void | Promise<void>,
) {
  const stream = createReadStream(filePath, { encoding: "utf8" });
  const rl = createInterface({ input: stream as ReadStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (!line.trim()) continue;
    const record = JSON.parse(line) as PixelRecord;
    await onRecord(record);
  }
}

export async function setSoldCount(count: number) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(SOLD_COUNT_PATH, String(count), "utf8");
}

export async function rebuildSoldBitmapFromSalesLog() {
  invalidateBitmapCache();
  const bitmap = createEmptyBitmap();
  let count = 0;

  try {
    await streamNdjson(SALES_LOG_PATH, (record) => {
      if (
        Number.isInteger(record.x) &&
        Number.isInteger(record.y) &&
        record.x >= 0 &&
        record.y >= 0 &&
        record.x < GRID_WIDTH &&
        record.y < GRID_HEIGHT
      ) {
        const index = record.y * GRID_WIDTH + record.x;
        const wasSet = (bitmap[index >> 3] & (1 << (index & 7))) !== 0;
        markPixelInBitmap(bitmap, record.x, record.y);
        if (!wasSet) count++;
      }
    });
  } catch {
    await saveSoldBitmap(bitmap);
    await setSoldCount(0);
    return;
  }

  await saveSoldBitmap(bitmap);
  await setSoldCount(count);
}

export async function repairSoldBitmapIfNeeded() {
  if (repairPromise) return repairPromise;

  repairPromise = (async () => {
    let fileCount = 0;
    try {
      fileCount = parseInt(await fs.readFile(SOLD_COUNT_PATH, "utf8"), 10);
      if (!Number.isFinite(fileCount) || fileCount < 0) fileCount = 0;
    } catch {
      fileCount = 0;
    }

    let bitmap: Buffer;
    try {
      const raw = await fs.readFile(BITMAP_PATH);
      if (raw.length !== BITMAP_BYTE_SIZE) {
        await rebuildSoldBitmapFromSalesLog();
        return;
      }
      bitmap = raw;
    } catch {
      await rebuildSoldBitmapFromSalesLog();
      return;
    }

    const bitmapCount = countSoldInBitmap(bitmap);
    const allMarkedSold = bitmapCount >= TOTAL_PIXELS - 1;
    const mismatch = fileCount > 0 && Math.abs(bitmapCount - fileCount) > 50;

    if (allMarkedSold && fileCount < TOTAL_PIXELS - 1000) {
      await rebuildSoldBitmapFromSalesLog();
      return;
    }

    if (mismatch) {
      await rebuildSoldBitmapFromSalesLog();
      return;
    }

    if (fileCount === 0 && bitmapCount > 0) {
      await setSoldCount(bitmapCount);
    }
  })().finally(() => {
    repairPromise = null;
  });

  return repairPromise;
}

async function migrateFromNdjson() {
  const bitmap = createEmptyBitmap();
  const batch: PixelRecord[] = [];

  await streamNdjson(SALES_LOG_PATH, (record) => {
    if (
      Number.isInteger(record.x) &&
      Number.isInteger(record.y) &&
      record.x >= 0 &&
      record.y >= 0 &&
      record.x < GRID_WIDTH &&
      record.y < GRID_HEIGHT
    ) {
      markPixelInBitmap(bitmap, record.x, record.y);
      batch.push(record);
    }
  });

  for (let i = 0; i < batch.length; i += 2000) {
    await paintRevealedPixels(batch.slice(i, i + 2000));
  }

  await saveSoldBitmap(bitmap);
  await setSoldCount(countSoldInBitmap(bitmap));
}

async function migrateFromLegacyJson() {
  const raw = await fs.readFile(PIXELS_PATH, "utf8");
  const pixels = JSON.parse(raw) as Record<string, PixelRecord>;
  const records = Object.values(pixels).filter(
    (r) =>
      Number.isInteger(r.x) &&
      Number.isInteger(r.y) &&
      r.x >= 0 &&
      r.y >= 0 &&
      r.x < GRID_WIDTH &&
      r.y < GRID_HEIGHT,
  );

  const bitmap = createEmptyBitmap();
  for (const record of records) {
    markPixelInBitmap(bitmap, record.x, record.y);
  }
  await saveSoldBitmap(bitmap);

  for (let i = 0; i < records.length; i += 2000) {
    await paintRevealedPixels(records.slice(i, i + 2000));
  }

  await setSoldCount(records.length);
}

export async function ensureSalesMigrated() {
  if (migrationPromise) return migrationPromise;

  migrationPromise = (async () => {
    try {
      await fs.access(BITMAP_PATH);
      await fs.access(MIGRATED_FLAG);
      await repairSoldBitmapIfNeeded();
      return;
    } catch {
      // run migration
    }

    invalidateBitmapCache();

    try {
      await fs.access(SALES_LOG_PATH);
      await migrateFromNdjson();
    } catch {
      try {
        await fs.access(PIXELS_PATH);
        await migrateFromLegacyJson();
      } catch {
        await loadSoldBitmap(true);
        await setSoldCount(0);
      }
    }

    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(MIGRATED_FLAG, new Date().toISOString(), "utf8");
    await repairSoldBitmapIfNeeded();
  })();

  return migrationPromise;
}

export async function incrementSoldCount(by: number) {
  let current = 0;
  try {
    current = parseInt(await fs.readFile(SOLD_COUNT_PATH, "utf8"), 10);
    if (!Number.isFinite(current) || current < 0) current = 0;
  } catch {
    current = 0;
  }
  await setSoldCount(current + by);
}

export async function getSoldCount(): Promise<number> {
  await ensureSalesMigrated();
  await repairSoldBitmapIfNeeded();

  try {
    const raw = await fs.readFile(SOLD_COUNT_PATH, "utf8");
    const count = parseInt(raw, 10);
    if (Number.isFinite(count) && count >= 0) return count;
  } catch {
    // rebuild from bitmap
  }

  const bitmap = await loadSoldBitmap(true);
  const count = countSoldInBitmap(bitmap);
  await setSoldCount(count);
  return count;
}

export async function isPixelSold(x: number, y: number): Promise<boolean> {
  await ensureSalesMigrated();
  await repairSoldBitmapIfNeeded();
  const bitmap = await loadSoldBitmap(true);
  return isPixelSoldInBitmap(bitmap, x, y);
}
