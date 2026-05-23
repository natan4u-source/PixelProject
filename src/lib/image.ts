import sharp from "sharp";
import { promises as fs } from "fs";
import { GRID_HEIGHT, GRID_WIDTH } from "./config";
import {
  decryptMasterVault,
  encryptMasterPng,
  isPngBuffer,
} from "./master-vault";
import {
  DATA_DIR,
  LEGACY_MASTER_IMAGE_PATH,
  MASTER_VAULT_PATH,
} from "./paths";
import { writeMeta } from "./store";

export type MasterPixelBuffer = {
  data: Buffer;
  width: number;
  height: number;
  channels: number;
};

let cachedPixels: MasterPixelBuffer | null = null;
let cachedVaultMtimeMs = 0;

async function readMasterPngBytes(): Promise<Buffer> {
  try {
    const vault = await fs.readFile(MASTER_VAULT_PATH);
    return decryptMasterVault(vault);
  } catch {
    // Fall through to legacy migration.
  }

  try {
    const legacy = await fs.readFile(LEGACY_MASTER_IMAGE_PATH);
    if (!isPngBuffer(legacy)) {
      throw new Error("Legacy master image is not a PNG.");
    }

    await writeEncryptedMaster(legacy);
    return legacy;
  } catch {
    throw new Error("Hidden image not found.");
  }
}

async function writeEncryptedMaster(pngBuffer: Buffer) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const encrypted = encryptMasterPng(pngBuffer);
  const tmp = `${MASTER_VAULT_PATH}.tmp`;
  await fs.writeFile(tmp, encrypted);
  await fs.rename(tmp, MASTER_VAULT_PATH);

  try {
    await fs.unlink(LEGACY_MASTER_IMAGE_PATH);
  } catch {
    // already migrated
  }

  cachedPixels = null;
  cachedVaultMtimeMs = 0;
}

export async function saveMasterImage(buffer: Buffer) {
  await fs.mkdir(DATA_DIR, { recursive: true });

  const pngBuffer = await sharp(buffer)
    .resize(GRID_WIDTH, GRID_HEIGHT, { fit: "fill" })
    .png()
    .toBuffer();

  await writeEncryptedMaster(pngBuffer);

  await writeMeta({
    width: GRID_WIDTH,
    height: GRID_HEIGHT,
    uploadedAt: new Date().toISOString(),
  });
}

export async function loadMasterPixels(): Promise<MasterPixelBuffer> {
  let mtimeMs = 0;
  try {
    mtimeMs = (await fs.stat(MASTER_VAULT_PATH)).mtimeMs;
  } catch {
    try {
      mtimeMs = (await fs.stat(LEGACY_MASTER_IMAGE_PATH)).mtimeMs;
    } catch {
      throw new Error("Hidden image not found.");
    }
  }

  if (cachedPixels && cachedVaultMtimeMs === mtimeMs) {
    return cachedPixels;
  }

  const pngBuffer = await readMasterPngBytes();
  const { data, info } = await sharp(pngBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  cachedPixels = {
    data,
    width: info.width,
    height: info.height,
    channels: info.channels,
  };
  cachedVaultMtimeMs = mtimeMs;

  return cachedPixels;
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
