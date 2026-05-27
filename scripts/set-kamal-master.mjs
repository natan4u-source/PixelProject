/**
 * Set Kamal (side a) master image and rebuild revealed.png from existing sold pixels.
 * Pixel positions and count are unchanged — only colors come from the new master.
 *
 * Usage: node scripts/set-kamal-master.mjs [path-to-png]
 * Default: assets/kamal-winner-master.png
 */
import { promises as fs, readFileSync } from "fs";
import path from "path";
import { randomFillSync, scryptSync, createCipheriv, createDecipheriv } from "crypto";
import sharp from "sharp";

const W = 1000;
const H = 1000;
const DATA = path.join(process.cwd(), "data");
const SIDE = "a";
const MAGIC = Buffer.from("PXLVAULT1");
const VAULT_SALT = "pixel-project-master-v1";

const sourcePath =
  process.argv[2] ??
  path.join(process.cwd(), "assets", "kamal-winner-master.png");

function sideDir() {
  return path.join(DATA, SIDE);
}

function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  try {
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq === -1) continue;
      const key = t.slice(0, eq).trim();
      const value = t.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // no .env.local
  }
}

function vaultKey() {
  const masterKey = process.env.MASTER_ENCRYPTION_KEY?.trim();
  const adminSecret = process.env.ADMIN_SECRET?.trim();
  const secret = masterKey || adminSecret;
  if (!secret) return null;
  return scryptSync(secret, VAULT_SALT, 32);
}

function encryptVault(png) {
  const key = vaultKey();
  if (!key) {
    console.warn("No MASTER_ENCRYPTION_KEY or ADMIN_SECRET — saving master.png only.");
    return null;
  }
  const iv = Buffer.alloc(12);
  randomFillSync(iv);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(png), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([MAGIC, iv, tag, encrypted]);
}

async function loadMasterPixels() {
  const encPath = path.join(sideDir(), "master.enc");
  const pngPath = path.join(sideDir(), "master.png");
  let png = null;

  try {
    const vault = await fs.readFile(encPath);
    if (vault.subarray(0, MAGIC.length).equals(MAGIC) && vaultKey()) {
      const iv = vault.subarray(MAGIC.length, MAGIC.length + 12);
      const tag = vault.subarray(MAGIC.length + 12, MAGIC.length + 28);
      const encrypted = vault.subarray(MAGIC.length + 28);
      const decipher = createDecipheriv("aes-256-gcm", vaultKey(), iv);
      decipher.setAuthTag(tag);
      png = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    }
  } catch {
    // try png
  }

  if (!png) {
    png = await fs.readFile(pngPath);
  }

  const { data, info } = await sharp(png).resize(W, H, { fit: "fill" }).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });
  return { data, info };
}

function colorAt(master, x, y) {
  const idx = (y * master.info.width + x) * master.info.channels;
  const r = master.data[idx];
  const g = master.data[idx + 1];
  const b = master.data[idx + 2];
  const a = master.info.channels === 4 ? master.data[idx + 3] : 255;
  if (a < 128) return "transparent";
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

async function readPixelsJson() {
  const raw = await fs.readFile(path.join(sideDir(), "pixels.json"), "utf8");
  return JSON.parse(raw);
}

async function writePixelsJson(pixels) {
  const content = JSON.stringify(pixels);
  await fs.writeFile(path.join(sideDir(), "pixels.json"), content, "utf8");
  await fs.writeFile(path.join(sideDir(), "pixels.backup.json"), content, "utf8");
}

async function paintRevealed(records) {
  const imagePath = path.join(sideDir(), "revealed.png");
  const { data, info } = await sharp({
    create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const CHUNK = 8000;
  for (let i = 0; i < records.length; i += CHUNK) {
    const batch = records.slice(i, i + CHUNK);
    for (const { x, y, color } of batch) {
      const idx = (y * info.width + x) * 4;
      if (color === "transparent") {
        data[idx + 3] = 0;
        continue;
      }
      data[idx] = parseInt(color.slice(1, 3), 16);
      data[idx + 1] = parseInt(color.slice(3, 5), 16);
      data[idx + 2] = parseInt(color.slice(5, 7), 16);
      data[idx + 3] = 255;
    }
    console.log(`  painted ${Math.min(i + CHUNK, records.length)} / ${records.length}`);
  }

  const tmp = `${imagePath}.tmp`;
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(tmp);
  await fs.rename(tmp, imagePath);
}

loadEnvFile();
await fs.mkdir(sideDir(), { recursive: true });

const src = path.resolve(sourcePath);
console.log(`Source image: ${src}`);
const pngBuffer = await sharp(src).resize(W, H, { fit: "fill" }).png().toBuffer();
await fs.writeFile(path.join(sideDir(), "master.png"), pngBuffer);

const vault = encryptVault(pngBuffer);
if (vault) {
  await fs.writeFile(path.join(sideDir(), "master.enc"), vault);
  console.log("Saved master.enc (1000×1000)");
} else {
  console.log("Saved master.png (1000×1000)");
}

const pixels = await readPixelsJson();
const keys = Object.keys(pixels);
console.log(`Rebuilding ${keys.length.toLocaleString()} pixels (same positions)…`);

const master = await loadMasterPixels();
const records = [];
for (const key of keys) {
  const p = pixels[key];
  const color = colorAt(master, p.x, p.y);
  pixels[key] = { ...p, color };
  records.push(pixels[key]);
}

await writePixelsJson(pixels);
await paintRevealed(records);

const soldCount = await fs.readFile(path.join(sideDir(), "sold.count"), "utf8");
console.log(`Done. Kamal sold count unchanged: ${soldCount.trim()}`);
console.log("Restart dev server / redeploy and hard-refresh the site.");
