import sharp from "sharp";
import { promises as fs } from "fs";
import { GRID_HEIGHT, GRID_WIDTH } from "./config";
import {
  decryptMasterVault,
  encryptMasterPng,
  isPngBuffer,
} from "./master-vault";
import {
  legacyMasterImagePath,
  masterVaultPath,
  sideDataDir,
} from "./paths";
import type { CanvasSide } from "./sides";
import { writeMeta, type Meta } from "./store";

export type MasterPixelBuffer = {
  data: Buffer;
  width: number;
  height: number;
  channels: number;
};

const cachedPixels = new Map<CanvasSide, MasterPixelBuffer>();
const cachedVaultMtime = new Map<CanvasSide, number>();

async function readMasterPngBytes(side: CanvasSide): Promise<Buffer> {
  const vaultPath = masterVaultPath(side);
  try {
    const vault = await fs.readFile(vaultPath);
    return decryptMasterVault(vault);
  } catch {
    // Fall through to legacy migration.
  }

  try {
    const legacyPath = legacyMasterImagePath(side);
    const legacy = await fs.readFile(legacyPath);
    if (!isPngBuffer(legacy)) {
      throw new Error("Legacy master image is not a PNG.");
    }

    await writeEncryptedMaster(side, legacy);
    return legacy;
  } catch {
    throw new Error("Hidden image not found.");
  }
}

async function writeEncryptedMaster(side: CanvasSide, pngBuffer: Buffer) {
  await fs.mkdir(sideDataDir(side), { recursive: true });
  const vaultPath = masterVaultPath(side);
  const encrypted = encryptMasterPng(pngBuffer);
  const tmp = `${vaultPath}.tmp`;
  await fs.writeFile(tmp, encrypted);
  await fs.rename(tmp, vaultPath);

  try {
    await fs.unlink(legacyMasterImagePath(side));
  } catch {
    // already migrated
  }

  cachedPixels.delete(side);
  cachedVaultMtime.delete(side);
}

export async function saveMasterImage(side: CanvasSide, buffer: Buffer) {
  await fs.mkdir(sideDataDir(side), { recursive: true });

  const pngBuffer = await sharp(buffer)
    .resize(GRID_WIDTH, GRID_HEIGHT, { fit: "fill" })
    .png()
    .toBuffer();

  await writeEncryptedMaster(side, pngBuffer);

  const meta: Meta = {
    width: GRID_WIDTH,
    height: GRID_HEIGHT,
    uploadedAt: new Date().toISOString(),
  };
  await writeMeta(side, meta);
}

export async function loadMasterPixels(side: CanvasSide): Promise<MasterPixelBuffer> {
  const vaultPath = masterVaultPath(side);
  let mtimeMs = 0;
  try {
    mtimeMs = (await fs.stat(vaultPath)).mtimeMs;
  } catch {
    try {
      mtimeMs = (await fs.stat(legacyMasterImagePath(side))).mtimeMs;
    } catch {
      throw new Error("Hidden image not found.");
    }
  }

  const cached = cachedPixels.get(side);
  const cachedMtime = cachedVaultMtime.get(side);
  if (cached && cachedMtime === mtimeMs) {
    return cached;
  }

  const pngBuffer = await readMasterPngBytes(side);
  const { data, info } = await sharp(pngBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  const pixels: MasterPixelBuffer = {
    data,
    width: info.width,
    height: info.height,
    channels: info.channels,
  };
  cachedPixels.set(side, pixels);
  cachedVaultMtime.set(side, mtimeMs);

  return pixels;
}

export function getPixelColorFromBuffer(
  pixels: MasterPixelBuffer,
  x: number,
  y: number,
): string {
  const idx = (y * pixels.width + x) * pixels.channels;
  const r = pixels.data[idx];
  const g = pixels.data[idx + 1];
  const b = pixels.data[idx + 2];
  const a = pixels.channels === 4 ? pixels.data[idx + 3] : 255;

  if (a < 128) {
    return "transparent";
  }

  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

export async function masterImageExists(side: CanvasSide) {
  for (const filePath of [masterVaultPath(side), legacyMasterImagePath(side)]) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      // try next
    }
  }
  return false;
}
