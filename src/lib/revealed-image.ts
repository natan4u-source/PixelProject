import sharp from "sharp";
import { promises as fs } from "fs";
import { GRID_HEIGHT, GRID_WIDTH } from "./config";
import { getPixelColorFromBuffer, loadMasterPixels } from "./image";
import { revealedImagePath, sideDataDir } from "./paths";
import type { CanvasSide } from "./sides";
import type { PixelRecord } from "./store";

export async function revealedImageExists(side: CanvasSide) {
  try {
    await fs.access(revealedImagePath(side));
    return true;
  } catch {
    return false;
  }
}

async function createTransparentRevealed(side: CanvasSide) {
  await fs.mkdir(sideDataDir(side), { recursive: true });
  await sharp({
    create: {
      width: GRID_WIDTH,
      height: GRID_HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .toFile(revealedImagePath(side));
}

export async function paintRevealedPixels(side: CanvasSide, records: PixelRecord[]) {
  if (records.length === 0) return;

  const master = await loadMasterPixels(side);
  const imagePath = revealedImagePath(side);

  if (!(await revealedImageExists(side))) {
    await createTransparentRevealed(side);
  }

  const { data, info } = await sharp(imagePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

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

  const tmp = `${imagePath}.tmp`;
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
    await fs.rename(tmp, imagePath);
  } catch {
    await fs.copyFile(tmp, imagePath);
    await fs.unlink(tmp);
  }
}

export async function clearRevealedImage(side: CanvasSide) {
  const imagePath = revealedImagePath(side);
  try {
    await fs.unlink(imagePath);
  } catch {
    // none yet
  }
  try {
    await fs.unlink(`${imagePath}.tmp`);
  } catch {
    // none
  }
}
