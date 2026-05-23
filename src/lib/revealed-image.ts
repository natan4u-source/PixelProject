import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";
import { GRID_HEIGHT, GRID_WIDTH } from "./config";
import { DATA_DIR } from "./paths";
import { getPixelColorFromBuffer, loadMasterPixels } from "./image";
import type { PixelRecord } from "./store";

export const REVEALED_IMAGE_PATH = path.join(DATA_DIR, "revealed.png");

export async function revealedImageExists() {
  try {
    await fs.access(REVEALED_IMAGE_PATH);
    return true;
  } catch {
    return false;
  }
}

async function createTransparentRevealed() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await sharp({
    create: {
      width: GRID_WIDTH,
      height: GRID_HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .toFile(REVEALED_IMAGE_PATH);
}

export async function paintRevealedPixels(records: PixelRecord[]) {
  if (records.length === 0) return;

  const master = await loadMasterPixels();

  if (!(await revealedImageExists())) {
    await createTransparentRevealed();
  }

  const { data, info } = await sharp(REVEALED_IMAGE_PATH)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (const { x, y } of records) {
    const color = getPixelColorFromBuffer(master, x, y);
    const idx = (y * info.width + x) * 4;

    if (color === "transparent") {
      data[idx + 3] = 0;
      continue;
    }

    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    data[idx] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = 255;
  }

  const tmp = `${REVEALED_IMAGE_PATH}.tmp`;
  try {
    await fs.unlink(tmp);
  } catch {
    // no stale tmp
  }

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(tmp);

  try {
    await fs.rename(tmp, REVEALED_IMAGE_PATH);
  } catch {
    await fs.copyFile(tmp, REVEALED_IMAGE_PATH);
    await fs.unlink(tmp);
  }
}

export async function clearRevealedImage() {
  try {
    await fs.unlink(REVEALED_IMAGE_PATH);
  } catch {
    // none yet
  }
  try {
    await fs.unlink(`${REVEALED_IMAGE_PATH}.tmp`);
  } catch {
    // none
  }
}
