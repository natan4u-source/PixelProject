import { createReadStream, type ReadStream } from "fs";
import { createInterface } from "readline";
import { promises as fs } from "fs";
import { GRID_HEIGHT, GRID_WIDTH } from "./config";
import { ensureDualSideLayout } from "./layout-migrate";
import {
  migratedFlagPath,
  pixelsPath,
  salesLogPath,
  sideDataDir,
  soldBitmapPath,
  soldCountPath,
} from "./paths";
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
import type { CanvasSide } from "./sides";
import type { PixelRecord } from "./store";

const migrationPromises = new Map<CanvasSide, Promise<void>>();
const repairPromises = new Map<CanvasSide, Promise<void>>();

export function resetSalesRuntimeCache(side?: CanvasSide) {
  if (side) {
    migrationPromises.delete(side);
    repairPromises.delete(side);
    invalidateBitmapCache(side);
    return;
  }
  migrationPromises.clear();
  repairPromises.clear();
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

export async function setSoldCount(side: CanvasSide, count: number) {
  await ensureDualSideLayout();
  await fs.mkdir(sideDataDir(side), { recursive: true });
  await fs.writeFile(soldCountPath(side), String(count), "utf8");
}

export async function rebuildSoldBitmapFromSalesLog(side: CanvasSide) {
  invalidateBitmapCache(side);
  const bitmap = createEmptyBitmap();
  let count = 0;

  try {
    await streamNdjson(salesLogPath(side), (record) => {
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
    await saveSoldBitmap(side, bitmap);
    await setSoldCount(side, 0);
    return;
  }

  await saveSoldBitmap(side, bitmap);
  await setSoldCount(side, count);
}

export async function repairSoldBitmapIfNeeded(side: CanvasSide) {
  const existing = repairPromises.get(side);
  if (existing) return existing;

  const promise = (async () => {
    const bitmapPath = soldBitmapPath(side);
    const countPath = soldCountPath(side);

    let fileCount = 0;
    try {
      fileCount = parseInt(await fs.readFile(countPath, "utf8"), 10);
      if (!Number.isFinite(fileCount) || fileCount < 0) fileCount = 0;
    } catch {
      fileCount = 0;
    }

    let bitmap: Buffer;
    try {
      const raw = await fs.readFile(bitmapPath);
      if (raw.length !== BITMAP_BYTE_SIZE) {
        await rebuildSoldBitmapFromSalesLog(side);
        return;
      }
      bitmap = raw;
    } catch {
      await rebuildSoldBitmapFromSalesLog(side);
      return;
    }

    const bitmapCount = countSoldInBitmap(bitmap);
    const allMarkedSold = bitmapCount >= TOTAL_PIXELS - 1;
    const mismatch = fileCount > 0 && Math.abs(bitmapCount - fileCount) > 50;

    if (allMarkedSold && fileCount < TOTAL_PIXELS - 1000) {
      await rebuildSoldBitmapFromSalesLog(side);
      return;
    }

    if (mismatch) {
      await rebuildSoldBitmapFromSalesLog(side);
      return;
    }

    if (fileCount === 0 && bitmapCount > 0) {
      await setSoldCount(side, bitmapCount);
    }
  })().finally(() => {
    repairPromises.delete(side);
  });

  repairPromises.set(side, promise);
  return promise;
}

async function migrateFromNdjson(side: CanvasSide) {
  const bitmap = createEmptyBitmap();
  const batch: PixelRecord[] = [];

  await streamNdjson(salesLogPath(side), (record) => {
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
    await paintRevealedPixels(side, batch.slice(i, i + 2000));
  }

  await saveSoldBitmap(side, bitmap);
  await setSoldCount(side, countSoldInBitmap(bitmap));
}

async function migrateFromLegacyJson(side: CanvasSide) {
  const raw = await fs.readFile(pixelsPath(side), "utf8");
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
  await saveSoldBitmap(side, bitmap);

  for (let i = 0; i < records.length; i += 2000) {
    await paintRevealedPixels(side, records.slice(i, i + 2000));
  }

  await setSoldCount(side, records.length);
}

export async function ensureSalesMigrated(side: CanvasSide) {
  await ensureDualSideLayout();

  const existing = migrationPromises.get(side);
  if (existing) return existing;

  const promise = (async () => {
    try {
      await fs.access(soldBitmapPath(side));
      await fs.access(migratedFlagPath(side));
      await repairSoldBitmapIfNeeded(side);
      return;
    } catch {
      // run migration
    }

    invalidateBitmapCache(side);

    try {
      await fs.access(salesLogPath(side));
      await migrateFromNdjson(side);
    } catch {
      try {
        await fs.access(pixelsPath(side));
        await migrateFromLegacyJson(side);
      } catch {
        await loadSoldBitmap(side, true);
        await setSoldCount(side, 0);
      }
    }

    await fs.mkdir(sideDataDir(side), { recursive: true });
    await fs.writeFile(migratedFlagPath(side), new Date().toISOString(), "utf8");
    await repairSoldBitmapIfNeeded(side);
  })();

  migrationPromises.set(side, promise);
  return promise;
}

export async function incrementSoldCount(side: CanvasSide, by: number) {
  let current = 0;
  try {
    current = parseInt(await fs.readFile(soldCountPath(side), "utf8"), 10);
    if (!Number.isFinite(current) || current < 0) current = 0;
  } catch {
    current = 0;
  }
  await setSoldCount(side, current + by);
}

export async function getSoldCount(side: CanvasSide): Promise<number> {
  await ensureSalesMigrated(side);
  await repairSoldBitmapIfNeeded(side);

  try {
    const raw = await fs.readFile(soldCountPath(side), "utf8");
    const count = parseInt(raw, 10);
    if (Number.isFinite(count) && count >= 0) return count;
  } catch {
    // rebuild from bitmap
  }

  const bitmap = await loadSoldBitmap(side, true);
  const count = countSoldInBitmap(bitmap);
  await setSoldCount(side, count);
  return count;
}

export async function isPixelSold(side: CanvasSide, x: number, y: number): Promise<boolean> {
  await ensureSalesMigrated(side);
  await repairSoldBitmapIfNeeded(side);
  const bitmap = await loadSoldBitmap(side, true);
  return isPixelSoldInBitmap(bitmap, x, y);
}
