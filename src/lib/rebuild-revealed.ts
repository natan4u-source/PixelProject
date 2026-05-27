import sharp from "sharp";
import { promises as fs } from "fs";
import { GRID_HEIGHT, GRID_WIDTH } from "./config";
import { getPixelColorFromBuffer, loadMasterPixels } from "./image";
import { revealedImagePath, sideDataDir } from "./paths";
import { clearRevealedImage } from "./revealed-image";
import type { CanvasSide } from "./sides";
import { readPixels, writePixels, type PixelRecord } from "./store";

async function paintAllRevealed(side: CanvasSide, records: PixelRecord[]) {
  await fs.mkdir(sideDataDir(side), { recursive: true });
  const imagePath = revealedImagePath(side);

  const { data, info } = await sharp({
    create: {
      width: GRID_WIDTH,
      height: GRID_HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const BATCH = 8000;
  for (let offset = 0; offset < records.length; offset += BATCH) {
    const batch = records.slice(offset, offset + BATCH);
    for (const { x, y, color } of batch) {
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
  }

  const tmp = `${imagePath}.tmp`;
  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(tmp);
  await fs.rename(tmp, imagePath);
}

/** Re-sample colors from the current master image; pixel coordinates stay the same. */
export async function rebuildAllRevealedFromMaster(side: CanvasSide): Promise<number> {
  const master = await loadMasterPixels(side);
  const pixels = await readPixels(side);
  const keys = Object.keys(pixels);

  if (keys.length === 0) {
    await clearRevealedImage(side);
    return 0;
  }

  const records: PixelRecord[] = [];
  for (const key of keys) {
    const p = pixels[key]!;
    const color = getPixelColorFromBuffer(master, p.x, p.y);
    const updated = { ...p, color };
    pixels[key] = updated;
    records.push(updated);
  }

  await writePixels(side, pixels);
  await paintAllRevealed(side, records);
  return records.length;
}
