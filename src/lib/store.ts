import { promises as fs } from "fs";
import { ensureDualSideLayout } from "./layout-migrate";
import { isPostgresEnabled } from "./env";
import { pgReadMeta, pgWriteMeta } from "./db/sales";
import {
  metaPath,
  pixelsBackupPath,
  pixelsPath,
  purchasesLogPath,
  salesLogPath,
  sideDataDir,
} from "./paths";
import type { CanvasSide } from "./sides";

export type PixelRecord = {
  x: number;
  y: number;
  color: string;
  purchasedAt: string;
};

export type Meta = {
  width: number;
  height: number;
  uploadedAt: string;
};

export type PixelsFile = Record<string, PixelRecord>;

async function ensureSideDir(side: CanvasSide) {
  await ensureDualSideLayout();
  await fs.mkdir(sideDataDir(side), { recursive: true });
}

export function pixelKey(x: number, y: number) {
  return `${x},${y}`;
}

async function rebuildFromSalesLog(side: CanvasSide): Promise<PixelsFile> {
  const pixels: PixelsFile = {};

  try {
    const raw = await fs.readFile(salesLogPath(side), "utf8");
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      const record = JSON.parse(line) as PixelRecord;
      pixels[pixelKey(record.x, record.y)] = record;
    }
  } catch {
    return pixels;
  }

  if (Object.keys(pixels).length > 0) {
    await writePixels(side, pixels);
  }

  return pixels;
}

async function readPixelsFile(filePath: string): Promise<PixelsFile | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    if (!raw.trim()) return {};
    return JSON.parse(raw) as PixelsFile;
  } catch {
    return null;
  }
}

async function ensureSalesLogFromPixels(side: CanvasSide, pixels: PixelsFile) {
  try {
    await fs.access(salesLogPath(side));
  } catch {
    await appendSales(side, Object.values(pixels));
  }
}

export async function readPixels(side: CanvasSide): Promise<PixelsFile> {
  const mainPath = pixelsPath(side);
  const backupPath = pixelsBackupPath(side);

  const main = await readPixelsFile(mainPath);
  if (main !== null) {
    if (Object.keys(main).length > 0) {
      await ensureSalesLogFromPixels(side, main);
    }
    return main;
  }

  const backup = await readPixelsFile(backupPath);
  if (backup !== null) {
    await writePixels(side, backup);
    if (Object.keys(backup).length > 0) {
      await ensureSalesLogFromPixels(side, backup);
    }
    return backup;
  }

  return rebuildFromSalesLog(side);
}

export async function writePixels(side: CanvasSide, pixels: PixelsFile) {
  await ensureSideDir(side);
  const mainPath = pixelsPath(side);
  const backupPath = pixelsBackupPath(side);
  const content = JSON.stringify(pixels);

  const tmpPath = `${mainPath}.tmp`;
  await fs.writeFile(tmpPath, content, "utf8");
  await fs.writeFile(backupPath, content, "utf8");
  await fs.rename(tmpPath, mainPath);
}

/** Append-only log so sales survive crashes and are easy to rebuild from. */
export async function appendSales(side: CanvasSide, records: PixelRecord[]) {
  if (records.length === 0) return;
  await ensureSideDir(side);
  const chunk = records.map((r) => JSON.stringify(r)).join("\n") + "\n";
  await fs.appendFile(salesLogPath(side), chunk, "utf8");
}

export async function clearAllSalesFiles(side: CanvasSide) {
  await ensureSideDir(side);
  const { createEmptyBitmap, saveSoldBitmap } = await import("./sold-bitmap");
  const { clearRevealedImage } = await import("./revealed-image");
  const { resetSalesRuntimeCache, setSoldCount } = await import("./migrate-sales");

  resetSalesRuntimeCache(side);

  await clearRevealedImage(side);

  for (const file of [
    pixelsPath(side),
    pixelsBackupPath(side),
    salesLogPath(side),
    purchasesLogPath(side),
    `${pixelsPath(side)}.tmp`,
    `${sideDataDir(side)}/sold.bitmap`,
    `${sideDataDir(side)}/sold.bitmap.tmp`,
    `${sideDataDir(side)}/revealed.png`,
    `${sideDataDir(side)}/revealed.png.tmp`,
    `${sideDataDir(side)}/.migrated`,
    `${sideDataDir(side)}/sold.count`,
  ]) {
    try {
      await fs.unlink(file);
    } catch {
      // already empty
    }
  }

  await saveSoldBitmap(side, createEmptyBitmap());
  await setSoldCount(side, 0);
}

export async function clearAllSales(side: CanvasSide) {
  const { clearAllSalesEverywhere } = await import("./sales-store");
  await clearAllSalesEverywhere(side);
}

export async function readMeta(side: CanvasSide): Promise<Meta | null> {
  if (isPostgresEnabled()) {
    return pgReadMeta(side);
  }

  try {
    const raw = await fs.readFile(metaPath(side), "utf8");
    return JSON.parse(raw) as Meta;
  } catch {
    return null;
  }
}

export async function writeMeta(side: CanvasSide, meta: Meta) {
  if (isPostgresEnabled()) {
    await pgWriteMeta(side, meta);
  }
  await ensureSideDir(side);
  await fs.writeFile(metaPath(side), JSON.stringify(meta, null, 2));
}

export { masterImageExists } from "./image";
