import { randomUUID } from "crypto";
import { GRID_HEIGHT, GRID_WIDTH } from "../config";
import type { CanvasSide } from "../sides";
import { ensureSchema, getPool } from "./pool";
import type { PixelRecord } from "../store";
import type { PurchaseLog, PurchaseType } from "../purchases";

export async function pgGetSoldCount(side: CanvasSide): Promise<number> {
  await ensureSchema();
  const { rows } = await getPool().query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM pixel_sales WHERE side = $1",
    [side],
  );
  return parseInt(rows[0]?.count ?? "0", 10) || 0;
}

export async function pgIsPixelSold(side: CanvasSide, x: number, y: number): Promise<boolean> {
  await ensureSchema();
  const { rows } = await getPool().query<{ exists: boolean }>(
    "SELECT EXISTS(SELECT 1 FROM pixel_sales WHERE side = $1 AND x = $2 AND y = $3) AS exists",
    [side, x, y],
  );
  return Boolean(rows[0]?.exists);
}

export async function pgInsertPurchase(
  side: CanvasSide,
  type: PurchaseType,
  pixels: PixelRecord[],
  totalInr: number,
): Promise<PurchaseLog> {
  await ensureSchema();
  const id = randomUUID();
  const purchasedAt = pixels[0]?.purchasedAt ?? new Date().toISOString();
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO purchases (id, side, type, purchased_at, pixel_count, total_inr)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, side, type, purchasedAt, pixels.length, totalInr],
    );

    for (const pixel of pixels) {
      await client.query(
        `INSERT INTO pixel_sales (side, x, y, color, purchased_at, purchase_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [side, pixel.x, pixel.y, pixel.color, pixel.purchasedAt, id],
      );
    }

    await client.query("COMMIT");

    return {
      id,
      type,
      purchasedAt,
      pixelCount: pixels.length,
      totalInr,
      pixels: pixels.map(({ x, y, color }) => ({ x, y, color })),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      throw new Error("This pixel is already sold.");
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function pgReadPurchases(
  side: CanvasSide,
  options: { limit: number; offset: number },
) {
  await ensureSchema();
  const db = getPool();

  const totalResult = await db.query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM purchases WHERE side = $1",
    [side],
  );
  const total = parseInt(totalResult.rows[0]?.count ?? "0", 10) || 0;

  const { rows } = await db.query<{
    id: string;
    type: PurchaseType;
    purchased_at: Date;
    pixel_count: number;
    total_inr: number;
  }>(
    `SELECT id, type, purchased_at, pixel_count, total_inr
     FROM purchases
     WHERE side = $1
     ORDER BY purchased_at DESC
     LIMIT $2 OFFSET $3`,
    [side, options.limit, options.offset],
  );

  const purchases: PurchaseLog[] = [];
  for (const row of rows) {
    const pixelRows = await db.query<{ x: number; y: number; color: string }>(
      `SELECT x, y, color FROM pixel_sales WHERE purchase_id = $1 ORDER BY y, x`,
      [row.id],
    );

    purchases.push({
      id: row.id,
      type: row.type,
      purchasedAt: row.purchased_at.toISOString(),
      pixelCount: row.pixel_count,
      totalInr: row.total_inr,
      pixels: pixelRows.rows,
    });
  }

  return {
    purchases,
    total,
    hasMore: options.offset + purchases.length < total,
  };
}

export async function pgClearAllSales(side: CanvasSide) {
  await ensureSchema();
  await getPool().query("DELETE FROM purchases WHERE side = $1", [side]);
}

export async function pgPickRandomUnsoldPixels(
  side: CanvasSide,
  count: number,
): Promise<{ x: number; y: number }[]> {
  await ensureSchema();
  const picked: { x: number; y: number }[] = [];
  const pickedKeys = new Set<string>();
  const maxAttempts = Math.max(count * 80, 500);
  const db = getPool();

  for (let attempt = 0; picked.length < count && attempt < maxAttempts; attempt++) {
    const x = Math.floor(Math.random() * GRID_WIDTH);
    const y = Math.floor(Math.random() * GRID_HEIGHT);
    const key = `${x},${y}`;
    if (pickedKeys.has(key)) continue;

    const { rows } = await db.query<{ exists: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM pixel_sales WHERE side = $1 AND x = $2 AND y = $3) AS exists",
      [side, x, y],
    );
    if (rows[0]?.exists) continue;

    pickedKeys.add(key);
    picked.push({ x, y });
  }

  return picked;
}

export async function pgWriteMeta(
  side: CanvasSide,
  meta: { width: number; height: number; uploadedAt: string },
) {
  await ensureSchema();
  await getPool().query(
    `INSERT INTO app_meta (key, value) VALUES ($1, $2::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [`grid:${side}`, JSON.stringify(meta)],
  );
}

export async function pgReadMeta(
  side: CanvasSide,
): Promise<{
  width: number;
  height: number;
  uploadedAt: string;
} | null> {
  await ensureSchema();
  const { rows } = await getPool().query<{ value: { width: number; height: number; uploadedAt: string } }>(
    "SELECT value FROM app_meta WHERE key = $1",
    [`grid:${side}`],
  );
  return rows[0]?.value ?? null;
}
