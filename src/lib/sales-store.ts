import { bumpRevealedEtag, invalidateStatusCache } from "./cache";
import { pgClearAllSales, pgGetSoldCount, pgIsPixelSold } from "./db/sales";
import { isPostgresEnabled, isRedisEnabled } from "./env";
import {
  redisClearSoldIndex,
  redisGetSoldCount,
  redisIsPixelSold,
  redisMarkPixelsSold,
  redisSetSoldCount,
} from "./redis/sold-index";
import {
  getSoldCount as fileGetSoldCount,
  isPixelSold as fileIsPixelSold,
} from "./migrate-sales";
import { clearAllSalesFiles } from "./store";
import type { CanvasSide } from "./sides";

export async function getSoldCountFast(side: CanvasSide): Promise<number> {
  if (isRedisEnabled()) {
    const cached = await redisGetSoldCount(side);
    if (cached !== null) return cached;
  }

  const count = isPostgresEnabled() ? await pgGetSoldCount(side) : await fileGetSoldCount(side);

  if (isRedisEnabled()) {
    await redisSetSoldCount(side, count);
  }

  return count;
}

export async function isPixelSoldFast(side: CanvasSide, x: number, y: number): Promise<boolean> {
  if (isRedisEnabled()) {
    const cached = await redisIsPixelSold(side, x, y);
    if (cached !== null) return cached;
  }

  return isPostgresEnabled()
    ? await pgIsPixelSold(side, x, y)
    : await fileIsPixelSold(side, x, y);
}

export async function markPixelsSold(
  side: CanvasSide,
  coords: { x: number; y: number }[],
  soldCountAfter: number,
) {
  if (isRedisEnabled()) {
    await redisMarkPixelsSold(side, coords, soldCountAfter);
  }
  await bumpRevealedEtag(side, soldCountAfter);
}

export async function clearAllSalesEverywhere(side: CanvasSide) {
  if (isPostgresEnabled()) {
    await pgClearAllSales(side);
  }
  if (isRedisEnabled()) {
    await redisClearSoldIndex(side);
  }
  await clearAllSalesFiles(side);
  await invalidateStatusCache(side);
}

export async function syncSoldCountCache(side: CanvasSide, count: number) {
  if (isRedisEnabled()) {
    await redisSetSoldCount(side, count);
  }
  await invalidateStatusCache(side);
}
