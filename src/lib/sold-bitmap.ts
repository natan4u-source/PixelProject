import { promises as fs } from "fs";
import { GRID_HEIGHT, GRID_WIDTH } from "./config";
import { soldBitmapPath, sideDataDir } from "./paths";
import type { CanvasSide } from "./sides";
import type { PixelRecord } from "./store";

export const TOTAL_PIXELS = GRID_WIDTH * GRID_HEIGHT;
export const BITMAP_BYTE_SIZE = Math.ceil(TOTAL_PIXELS / 8);

const cachedBitmaps = new Map<CanvasSide, Buffer>();

export function invalidateBitmapCache(side?: CanvasSide) {
  if (side) {
    cachedBitmaps.delete(side);
    return;
  }
  cachedBitmaps.clear();
}

export function createEmptyBitmap() {
  return Buffer.alloc(BITMAP_BYTE_SIZE, 0);
}

export async function loadSoldBitmap(side: CanvasSide, forceReload = false): Promise<Buffer> {
  if (!forceReload) {
    const cached = cachedBitmaps.get(side);
    if (cached) return cached;
  }

  const bitmapPath = soldBitmapPath(side);

  try {
    const buf = await fs.readFile(bitmapPath);
    if (buf.length === BITMAP_BYTE_SIZE) {
      cachedBitmaps.set(side, buf);
      return buf;
    }
  } catch {
    // fall through
  }

  const empty = createEmptyBitmap();
  cachedBitmaps.set(side, empty);
  return empty;
}

export function isPixelSoldInBitmap(bitmap: Buffer, x: number, y: number) {
  if (x < 0 || y < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT) return false;
  const index = y * GRID_WIDTH + x;
  return (bitmap[index >> 3] & (1 << (index & 7))) !== 0;
}

export function markPixelInBitmap(bitmap: Buffer, x: number, y: number) {
  if (x < 0 || y < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT) return;
  const index = y * GRID_WIDTH + x;
  bitmap[index >> 3] |= 1 << (index & 7);
}

export function countSoldInBitmap(bitmap: Buffer) {
  let count = 0;
  for (let i = 0; i < TOTAL_PIXELS; i++) {
    if ((bitmap[i >> 3] & (1 << (i & 7))) !== 0) count++;
  }
  return count;
}

export async function saveSoldBitmap(side: CanvasSide, bitmap: Buffer) {
  await fs.mkdir(sideDataDir(side), { recursive: true });
  const bitmapPath = soldBitmapPath(side);
  const tmp = `${bitmapPath}.tmp`;
  try {
    await fs.unlink(tmp);
  } catch {
    // no tmp yet
  }
  await fs.writeFile(tmp, bitmap);
  try {
    await fs.rename(tmp, bitmapPath);
  } catch {
    await fs.copyFile(tmp, bitmapPath);
    await fs.unlink(tmp);
  }
  cachedBitmaps.set(side, bitmap);
}

export async function applySoldRecords(side: CanvasSide, records: PixelRecord[]) {
  const bitmap = Buffer.from(await loadSoldBitmap(side));
  for (const { x, y } of records) {
    markPixelInBitmap(bitmap, x, y);
  }
  await saveSoldBitmap(side, bitmap);
  return bitmap;
}
