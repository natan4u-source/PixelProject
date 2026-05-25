/**
 * Seed random sold pixels in the CENTER vertical third only (file storage).
 * Clears existing sales on each side, then places pixels only in the middle column.
 *
 * Usage:
 *   node scripts/seed-random-pixels.mjs [kamalCount] [cockroachCount]  — reset + seed
 *   node scripts/seed-random-pixels.mjs add a 30000                    — add pixels to Kamal only
 *   node scripts/seed-random-pixels.mjs add b 5000                     — add pixels to Cockroach only
 *
 * Grid 1000×1000 split into 3 vertical strips (by column / x):
 *   left   x 0–332
 *   center x 333–665  ← pixels seeded here only
 *   right  x 666–999
 */
import { promises as fs, readFileSync } from "fs";
import path from "path";
import { randomUUID, scryptSync, createDecipheriv } from "crypto";
import sharp from "sharp";

const W = 1000;
const H = 1000;
const TOTAL = W * H;
const BYTE_SIZE = Math.ceil(TOTAL / 8);
const DATA = path.join(process.cwd(), "data");
const SIDES = ["a", "b"];
const X_CENTER_START = Math.floor(W / 3);
const X_CENTER_END = Math.floor((2 * W) / 3) - 1;
const CENTER_PIXELS = H * (X_CENTER_END - X_CENTER_START + 1);

const argA = parseInt(process.argv[2] ?? "", 10);
const argB = parseInt(process.argv[3] ?? "", 10);
const COUNTS = {
  a: Math.min(CENTER_PIXELS, Number.isFinite(argA) && argA > 0 ? argA : 100000),
  b: Math.min(
    CENTER_PIXELS,
    Number.isFinite(argB) && argB > 0 ? argB : Number.isFinite(argA) && argA > 0 ? argA : 100000,
  ),
};

const MAGIC = Buffer.from("PXLVLT1");
const VAULT_SALT = "pixel-project-master-v1";

function sideDir(side) {
  return path.join(DATA, side);
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

function decryptVault(buf) {
  const key = vaultKey();
  if (!key) return null;
  const iv = buf.subarray(MAGIC.length, MAGIC.length + 12);
  const tag = buf.subarray(MAGIC.length + 12, MAGIC.length + 28);
  const encrypted = buf.subarray(MAGIC.length + 28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

async function loadMasterPixels(side) {
  const encPath = path.join(sideDir(side), "master.enc");
  const pngPath = path.join(sideDir(side), "master.png");
  let png = null;

  try {
    const vault = await fs.readFile(encPath);
    if (vault.subarray(0, MAGIC.length).equals(MAGIC)) {
      png = decryptVault(vault);
    }
  } catch {
    // try legacy png
  }

  if (!png) {
    try {
      png = await fs.readFile(pngPath);
    } catch {
      return null;
    }
  }

  const { data, info } = await sharp(png).resize(W, H, { fit: "fill" }).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

function colorAt(master, x, y) {
  const idx = (y * master.width + x) * master.channels;
  const r = master.data[idx];
  const g = master.data[idx + 1];
  const b = master.data[idx + 2];
  const a = master.channels === 4 ? master.data[idx + 3] : 255;
  if (a < 128) return "transparent";
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

function randomColor() {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/** Unique random pixels only in center vertical strip */
function pickCenterBandCoords(count) {
  const chosen = new Set();
  while (chosen.size < count) {
    const x = X_CENTER_START + Math.floor(Math.random() * (X_CENTER_END - X_CENTER_START + 1));
    const y = Math.floor(Math.random() * H);
    chosen.add(`${x},${y}`);
  }
  return Array.from(chosen).map((key) => {
    const [xs, ys] = key.split(",");
    return { x: parseInt(xs, 10), y: parseInt(ys, 10) };
  });
}

function markBitmap(bitmap, x, y) {
  const index = y * W + x;
  bitmap[index >> 3] |= 1 << (index & 7);
}

function isPixelSoldInBitmap(bitmap, x, y) {
  const index = y * W + x;
  return (bitmap[index >> 3] & (1 << (index & 7))) !== 0;
}

async function loadSoldBitmap(side) {
  const bitmapPath = path.join(sideDir(side), "sold.bitmap");
  try {
    const buf = await fs.readFile(bitmapPath);
    if (buf.length === BYTE_SIZE) return buf;
  } catch {
    // fall through
  }
  return Buffer.alloc(BYTE_SIZE, 0);
}

/** Unique unsold pixels in center vertical strip */
function pickCenterBandCoordsUnsold(bitmap, count) {
  const chosen = new Set();
  const maxAttempts = Math.max(count * 80, 100_000);
  let attempts = 0;

  while (chosen.size < count && attempts < maxAttempts) {
    attempts++;
    const x = X_CENTER_START + Math.floor(Math.random() * (X_CENTER_END - X_CENTER_START + 1));
    const y = Math.floor(Math.random() * H);
    const key = `${x},${y}`;
    if (chosen.has(key) || isPixelSoldInBitmap(bitmap, x, y)) continue;
    chosen.add(key);
  }

  if (chosen.size < count) {
    throw new Error(
      `Only ${chosen.size.toLocaleString()} unsold pixels left in center strip (needed ${count.toLocaleString()}).`,
    );
  }

  return Array.from(chosen).map((key) => {
    const [xs, ys] = key.split(",");
    return { x: parseInt(xs, 10), y: parseInt(ys, 10) };
  });
}

async function clearSide(side) {
  const dir = sideDir(side);
  await fs.mkdir(dir, { recursive: true });
  const names = [
    "pixels.json",
    "pixels.backup.json",
    "sales.ndjson",
    "purchases.ndjson",
    "sold.bitmap",
    "sold.bitmap.tmp",
    "revealed.png",
    "revealed.png.tmp",
    ".migrated",
    "sold.count",
    "pixels.json.tmp",
  ];
  for (const name of names) {
    try {
      await fs.unlink(path.join(dir, name));
    } catch {
      // skip
    }
  }
}

async function paintRevealed(side, records) {
  const imagePath = path.join(sideDir(side), "revealed.png");
  await fs.mkdir(sideDir(side), { recursive: true });

  let data;
  let info;
  try {
    const existing = await sharp(imagePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    data = existing.data;
    info = existing.info;
  } catch {
    const created = await sharp({
      create: {
        width: W,
        height: H,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    data = created.data;
    info = created.info;
  }

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
    console.log(`  painted ${Math.min(offset + BATCH, records.length)} / ${records.length}`);
  }

  const tmp = `${imagePath}.tmp`;
  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(tmp);
  await fs.rename(tmp, imagePath);
}

async function seedSide(side) {
  const count = COUNTS[side];
  console.log(
    `\n=== Side ${side.toUpperCase()} → ${count.toLocaleString()} pixels in center strip (x ${X_CENTER_START}–${X_CENTER_END}) ===`,
  );
  await clearSide(side);

  const master = await loadMasterPixels(side);
  if (master) {
    console.log("  using master image colors");
  } else {
    console.log("  no master image — using random colors (upload master in admin for real colors)");
  }

  const coords = pickCenterBandCoords(count);
  const purchasedAt = new Date().toISOString();
  const records = coords.map(({ x, y }) => ({
    x,
    y,
    color: master ? colorAt(master, x, y) : randomColor(),
    purchasedAt,
  }));

  const bitmap = Buffer.alloc(BYTE_SIZE, 0);
  for (const { x, y } of records) {
    markBitmap(bitmap, x, y);
  }
  await fs.writeFile(path.join(sideDir(side), "sold.bitmap"), bitmap);
  await fs.writeFile(path.join(sideDir(side), "sold.count"), String(count));
  await fs.writeFile(path.join(sideDir(side), ".migrated"), purchasedAt);

  const salesPath = path.join(sideDir(side), "sales.ndjson");
  const CHUNK = 5000;
  for (let i = 0; i < records.length; i += CHUNK) {
    const chunk = records.slice(i, i + CHUNK);
    const lines = chunk.map((r) => JSON.stringify(r)).join("\n") + "\n";
    if (i === 0) {
      await fs.writeFile(salesPath, lines, "utf8");
    } else {
      await fs.appendFile(salesPath, lines, "utf8");
    }
  }

  const pixels = {};
  for (const r of records) {
    pixels[`${r.x},${r.y}`] = r;
  }
  const pixelsJson = JSON.stringify(pixels);
  await fs.writeFile(path.join(sideDir(side), "pixels.json"), pixelsJson, "utf8");
  await fs.writeFile(path.join(sideDir(side), "pixels.backup.json"), pixelsJson, "utf8");

  const purchase = {
    id: randomUUID(),
    type: "bulk",
    purchasedAt,
    pixelCount: count,
    totalInr: count * 50,
    region: "center-vertical-third",
    xRange: [X_CENTER_START, X_CENTER_END],
    pixels: records.slice(0, 50).map(({ x, y, color }) => ({ x, y, color })),
    note: "Seeded center band — sample pixels only in log",
  };
  await fs.writeFile(
    path.join(sideDir(side), "purchases.ndjson"),
    JSON.stringify(purchase) + "\n",
    "utf8",
  );

  console.log("  building revealed.png …");
  await paintRevealed(side, records);
  console.log(`  done — ${count.toLocaleString()} pixels on side ${side}`);
}

async function readPixelsJson(side) {
  try {
    const raw = await fs.readFile(path.join(sideDir(side), "pixels.json"), "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function addSide(side, addCount) {
  console.log(
    `\n=== Side ${side.toUpperCase()} → add ${addCount.toLocaleString()} random pixels (center strip x ${X_CENTER_START}–${X_CENTER_END}) ===`,
  );

  const bitmap = await loadSoldBitmap(side);
  let current = 0;
  try {
    current = parseInt(await fs.readFile(path.join(sideDir(side), "sold.count"), "utf8"), 10);
    if (!Number.isFinite(current) || current < 0) current = 0;
  } catch {
    current = 0;
  }

  const master = await loadMasterPixels(side);
  const coords = pickCenterBandCoordsUnsold(bitmap, addCount);
  const purchasedAt = new Date().toISOString();
  const records = coords.map(({ x, y }) => ({
    x,
    y,
    color: master ? colorAt(master, x, y) : randomColor(),
    purchasedAt,
  }));

  for (const { x, y } of records) {
    markBitmap(bitmap, x, y);
  }

  const newTotal = current + records.length;
  await fs.writeFile(path.join(sideDir(side), "sold.bitmap"), bitmap);
  await fs.writeFile(path.join(sideDir(side), "sold.count"), String(newTotal));

  const salesPath = path.join(sideDir(side), "sales.ndjson");
  const CHUNK = 5000;
  for (let i = 0; i < records.length; i += CHUNK) {
    const chunk = records.slice(i, i + CHUNK);
    const lines = chunk.map((r) => JSON.stringify(r)).join("\n") + "\n";
    await fs.appendFile(salesPath, lines, "utf8");
  }

  const pixels = await readPixelsJson(side);
  for (const r of records) {
    pixels[`${r.x},${r.y}`] = r;
  }
  const pixelsJson = JSON.stringify(pixels);
  await fs.writeFile(path.join(sideDir(side), "pixels.json"), pixelsJson, "utf8");
  await fs.writeFile(path.join(sideDir(side), "pixels.backup.json"), pixelsJson, "utf8");

  const purchase = {
    id: randomUUID(),
    type: "bulk",
    purchasedAt,
    pixelCount: records.length,
    totalInr: records.length * 50,
    region: "center-vertical-third",
    xRange: [X_CENTER_START, X_CENTER_END],
    note: "Added pixels to center strip",
    pixels: records.slice(0, 50).map(({ x, y, color }) => ({ x, y, color })),
  };
  await fs.appendFile(
    path.join(sideDir(side), "purchases.ndjson"),
    JSON.stringify(purchase) + "\n",
    "utf8",
  );

  console.log("  updating revealed.png …");
  await paintRevealed(side, records);
  console.log(
    `  done — ${records.length.toLocaleString()} added, total now ${newTotal.toLocaleString()} on side ${side}`,
  );
}

loadEnvFile();
await fs.mkdir(DATA, { recursive: true });

const mode = process.argv[2];
if (mode === "reset") {
  for (const side of SIDES) {
    console.log(`\n=== Reset side ${side.toUpperCase()} → 0 pixels ===`);
    await clearSide(side);
  }
  console.log("\nDone. Both sides cleared to 0 sold pixels.");
} else if (mode === "add") {
  const side = (process.argv[3] ?? "a").toLowerCase();
  const addCount = parseInt(process.argv[4] ?? "", 10);
  if (side !== "a" && side !== "b") {
    console.error("Side must be a (Kamal) or b (Cockroach).");
    process.exit(1);
  }
  if (!Number.isFinite(addCount) || addCount < 1) {
    console.error("Provide a positive pixel count to add.");
    process.exit(1);
  }
  await addSide(side, Math.min(addCount, CENTER_PIXELS));
  console.log("\nDone. Refresh the site to see new pixels.");
} else {
  console.log(
    `Clearing old sales, then seeding center vertical strip (x ${X_CENTER_START}–${X_CENTER_END}): Kamal=${COUNTS.a.toLocaleString()}, Cockroach=${COUNTS.b.toLocaleString()}…`,
  );

  for (const side of SIDES) {
    await seedSide(side);
  }

  console.log("\nDone. Left and right thirds are empty; center vertical strip has random sold pixels.");
  console.log("Restart dev server / redeploy and refresh the site.");
}
