import { promises as fs } from "fs";
import { GRID_HEIGHT, GRID_WIDTH } from "./config";
import { DATA_DIR } from "./paths";
import path from "path";
import type { PixelRecord } from "./store";

const BITMAP_PATH = path.join(DATA_DIR, "sold.bitmap");
export const TOTAL_PIXELS = GRID_WIDTH * GRID_HEIGHT;
export const BITMAP_BYTE_SIZE = Math.ceil(TOTAL_PIXELS / 8);

let cachedBitmap: Buffer | null = null;

export function invalidateBitmapCache() {
  cachedBitmap = null;
}

export function createEmptyBitmap() {
  return Buffer.alloc(BITMAP_BYTE_SIZE, 0);
}

export async function loadSoldBitmap(forceReload = false): Promise<Buffer> {
  if (!forceReload && cachedBitmap) return cachedBitmap;

  try {
    const buf = await fs.readFile(BITMAP_PATH);
    if (buf.length === BITMAP_BYTE_SIZE) {
      cachedBitmap = buf;
      return buf;
    }
  } catch {
    // fall through
  }

  cachedBitmap = createEmptyBitmap();
  return cachedBitmap;
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

export async function saveSoldBitmap(bitmap: Buffer) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${BITMAP_PATH}.tmp`;
  try {
    await fs.unlink(tmp);
  } catch {
    // no tmp yet
  }
  await fs.writeFile(tmp, bitmap);
  try {
    await fs.rename(tmp, BITMAP_PATH);
  } catch {
    await fs.copyFile(tmp, BITMAP_PATH);
    await fs.unlink(tmp);
  }
  cachedBitmap = bitmap;
}

export async function applySoldRecords(records: PixelRecord[]) {
  const bitmap = Buffer.from(await loadSoldBitmap());
  for (const { x, y } of records) {
    markPixelInBitmap(bitmap, x, y);
  }
  await saveSoldBitmap(bitmap);
  return bitmap;
}
