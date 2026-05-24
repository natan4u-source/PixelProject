import { Pool } from "pg";
import { getDatabaseUrl } from "../env";

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

export function getPool() {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!pool) {
    pool = new Pool({
      connectionString: url,
      max: Number(process.env.PG_POOL_MAX ?? 20),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }

  return pool;
}

export async function ensureSchema() {
  if (!getDatabaseUrl()) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    const db = getPool();
    await db.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id UUID PRIMARY KEY,
        side TEXT NOT NULL DEFAULT 'a' CHECK (side IN ('a', 'b')),
        type TEXT NOT NULL CHECK (type IN ('single', 'bulk')),
        purchased_at TIMESTAMPTZ NOT NULL,
        pixel_count INTEGER NOT NULL,
        total_inr INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pixel_sales (
        side TEXT NOT NULL DEFAULT 'a' CHECK (side IN ('a', 'b')),
        x INTEGER NOT NULL,
        y INTEGER NOT NULL,
        color TEXT NOT NULL,
        purchased_at TIMESTAMPTZ NOT NULL,
        purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
        PRIMARY KEY (side, x, y)
      );

      CREATE INDEX IF NOT EXISTS idx_pixel_sales_purchase_id ON pixel_sales (purchase_id);
      CREATE INDEX IF NOT EXISTS idx_purchases_purchased_at ON purchases (purchased_at DESC);
      CREATE INDEX IF NOT EXISTS idx_purchases_side ON purchases (side);
      CREATE INDEX IF NOT EXISTS idx_pixel_sales_side ON pixel_sales (side);

      CREATE TABLE IF NOT EXISTS app_meta (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL
      );
    `);

    await db.query(`
      ALTER TABLE purchases ADD COLUMN IF NOT EXISTS side TEXT NOT NULL DEFAULT 'a';
      ALTER TABLE pixel_sales ADD COLUMN IF NOT EXISTS side TEXT NOT NULL DEFAULT 'a';
    `).catch(() => {
      // columns may already exist with constraints
    });
  })();

  return schemaReady;
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    schemaReady = null;
  }
}
