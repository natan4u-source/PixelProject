import { promises as fs } from "fs";
import { isPostgresEnabled } from "./env";
import { pgReadMeta, pgWriteMeta } from "./db/sales";
import {
  DATA_DIR,
  LEGACY_MASTER_IMAGE_PATH,
  MASTER_VAULT_PATH,
  META_PATH,
  PIXELS_BACKUP_PATH,
  PIXELS_PATH,
  PURCHASES_LOG_PATH,
  SALES_LOG_PATH,
} from "./paths";

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

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export function pixelKey(x: number, y: number) {
  return `${x},${y}`;
}

async function rebuildFromSalesLog(): Promise<PixelsFile> {
  const pixels: PixelsFile = {};

  try {
    const raw = await fs.readFile(SALES_LOG_PATH, "utf8");
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      const record = JSON.parse(line) as PixelRecord;
      pixels[pixelKey(record.x, record.y)] = record;
    }
  } catch {
    return pixels;
  }

  if (Object.keys(pixels).length > 0) {
    await writePixels(pixels);
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

async function ensureSalesLogFromPixels(pixels: PixelsFile) {
  try {
    await fs.access(SALES_LOG_PATH);
  } catch {
    await appendSales(Object.values(pixels));
  }
}

export async function readPixels(): Promise<PixelsFile> {
  const main = await readPixelsFile(PIXELS_PATH);
  if (main !== null) {
    if (Object.keys(main).length > 0) {
      await ensureSalesLogFromPixels(main);
    }
    return main;
  }

  const backup = await readPixelsFile(PIXELS_BACKUP_PATH);
  if (backup !== null) {
    await writePixels(backup);
    if (Object.keys(backup).length > 0) {
      await ensureSalesLogFromPixels(backup);
    }
    return backup;
  }

  return rebuildFromSalesLog();
}

export async function writePixels(pixels: PixelsFile) {
  await ensureDataDir();
  const content = JSON.stringify(pixels);

  const tmpPath = `${PIXELS_PATH}.tmp`;
  await fs.writeFile(tmpPath, content, "utf8");
  await fs.writeFile(PIXELS_BACKUP_PATH, content, "utf8");
  await fs.rename(tmpPath, PIXELS_PATH);
}

/** Append-only log so sales survive crashes and are easy to rebuild from. */
export async function appendSales(records: PixelRecord[]) {
  if (records.length === 0) return;
  await ensureDataDir();
  const chunk = records.map((r) => JSON.stringify(r)).join("\n") + "\n";
  await fs.appendFile(SALES_LOG_PATH, chunk, "utf8");
}

export async function clearAllSalesFiles() {
  await ensureDataDir();
  const { createEmptyBitmap, saveSoldBitmap } = await import("./sold-bitmap");
  const { clearRevealedImage } = await import("./revealed-image");
  const { resetSalesRuntimeCache, setSoldCount } = await import("./migrate-sales");
  const pathMod = await import("path");
  const { DATA_DIR } = await import("./paths");

  resetSalesRuntimeCache();
  await clearRevealedImage();

  for (const file of [
    PIXELS_PATH,
    PIXELS_BACKUP_PATH,
    SALES_LOG_PATH,
    PURCHASES_LOG_PATH,
    `${PIXELS_PATH}.tmp`,
    pathMod.join(DATA_DIR, "sold.bitmap"),
    pathMod.join(DATA_DIR, "sold.bitmap.tmp"),
    pathMod.join(DATA_DIR, "revealed.png"),
    pathMod.join(DATA_DIR, "revealed.png.tmp"),
    pathMod.join(DATA_DIR, ".migrated"),
    pathMod.join(DATA_DIR, "sold.count"),
  ]) {
    try {
      await fs.unlink(file);
    } catch {
      // already empty
    }
  }

  await saveSoldBitmap(createEmptyBitmap());
  await setSoldCount(0);
}

export async function clearAllSales() {
  const { clearAllSalesEverywhere } = await import("./sales-store");
  await clearAllSalesEverywhere();
}

export async function readMeta(): Promise<Meta | null> {
  if (isPostgresEnabled()) {
    return pgReadMeta();
  }

  try {
    const raw = await fs.readFile(META_PATH, "utf8");
    return JSON.parse(raw) as Meta;
  } catch {
    return null;
  }
}

export async function writeMeta(meta: Meta) {
  if (isPostgresEnabled()) {
    await pgWriteMeta(meta);
  }
  await ensureDataDir();
  await fs.writeFile(META_PATH, JSON.stringify(meta, null, 2));
}

export async function masterImageExists() {
  for (const filePath of [MASTER_VAULT_PATH, LEGACY_MASTER_IMAGE_PATH]) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      // try next
    }
  }
  return false;
}
