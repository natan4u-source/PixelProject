#!/usr/bin/env node
/**
 * One-time migration: data/sales.ndjson + purchases.ndjson -> Postgres.
 *
 * Usage:
 *   set DATABASE_URL=postgres://...
 *   node scripts/migrate-to-postgres.mjs
 */
import { createReadStream } from "fs";
import { createInterface } from "readline";
import { access, readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const { Pool } = pg;
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "data");
const salesPath = path.join(dataDir, "sales.ndjson");
const purchasesPath = path.join(dataDir, "purchases.ndjson");
const metaPath = path.join(dataDir, "meta.json");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Set DATABASE_URL before running this script.");
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS purchases (
      id UUID PRIMARY KEY,
      type TEXT NOT NULL CHECK (type IN ('single', 'bulk')),
      purchased_at TIMESTAMPTZ NOT NULL,
      pixel_count INTEGER NOT NULL,
      total_inr INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pixel_sales (
      x INTEGER NOT NULL,
      y INTEGER NOT NULL,
      color TEXT NOT NULL,
      purchased_at TIMESTAMPTZ NOT NULL,
      purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
      PRIMARY KEY (x, y)
    );

    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL
    );
  `);
}

async function streamNdjson(filePath, onLine) {
  const stream = createReadStream(filePath, { encoding: "utf8" });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    onLine(JSON.parse(line));
  }
}

async function migratePurchases() {
  try {
    await access(purchasesPath);
  } catch {
    console.log("No purchases.ndjson — skipping purchases import.");
    return;
  }

  let count = 0;
  await streamNdjson(purchasesPath, async (entry) => {
    await pool.query(
      `INSERT INTO purchases (id, type, purchased_at, pixel_count, total_inr)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [entry.id, entry.type, entry.purchasedAt, entry.pixelCount, entry.totalInr],
    );

    for (const pixel of entry.pixels ?? []) {
      await pool.query(
        `INSERT INTO pixel_sales (x, y, color, purchased_at, purchase_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (x, y) DO NOTHING`,
        [pixel.x, pixel.y, pixel.color, entry.purchasedAt, entry.id],
      );
    }
    count++;
    if (count % 100 === 0) console.log(`Imported ${count} purchases...`);
  });

  console.log(`Imported ${count} purchase receipts.`);
}

async function migrateSalesOnly() {
  try {
    await access(salesPath);
  } catch {
    return;
  }

  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM pixel_sales");
  if (rows[0]?.count > 0) {
    console.log("pixel_sales already populated — skipping sales.ndjson import.");
    return;
  }

  let count = 0;
  const placeholderPurchaseId = "00000000-0000-4000-8000-000000000001";
  await pool.query(
    `INSERT INTO purchases (id, type, purchased_at, pixel_count, total_inr)
     VALUES ($1, 'bulk', NOW(), 0, 0)
     ON CONFLICT (id) DO NOTHING`,
    [placeholderPurchaseId],
  );

  await streamNdjson(salesPath, async (record) => {
    await pool.query(
      `INSERT INTO pixel_sales (x, y, color, purchased_at, purchase_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (x, y) DO NOTHING`,
      [record.x, record.y, record.color, record.purchasedAt, placeholderPurchaseId],
    );
    count++;
    if (count % 10000 === 0) console.log(`Imported ${count} pixel sales...`);
  });

  console.log(`Imported ${count} pixel sales from sales.ndjson.`);
}

async function migrateMeta() {
  try {
    const raw = await readFile(metaPath, "utf8");
    const meta = JSON.parse(raw);
    await pool.query(
      `INSERT INTO app_meta (key, value) VALUES ('grid', $1::jsonb)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [JSON.stringify(meta)],
    );
    console.log("Imported meta.json.");
  } catch {
    console.log("No meta.json — skipping.");
  }
}

try {
  await ensureSchema();
  await migratePurchases();
  await migrateSalesOnly();
  await migrateMeta();
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM pixel_sales");
  console.log(`Done. pixel_sales rows: ${rows[0]?.count ?? 0}`);
} finally {
  await pool.end();
}
