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

export async function getSoldCountFast(): Promise<number> {
  if (isRedisEnabled()) {
    const cached = await redisGetSoldCount();
    if (cached !== null) return cached;
  }

  const count = isPostgresEnabled() ? await pgGetSoldCount() : await fileGetSoldCount();

  if (isRedisEnabled()) {
    await redisSetSoldCount(count);
  }

  return count;
}

export async function isPixelSoldFast(x: number, y: number): Promise<boolean> {
  if (isRedisEnabled()) {
    const cached = await redisIsPixelSold(x, y);
    if (cached !== null) return cached;
  }

  return isPostgresEnabled() ? await pgIsPixelSold(x, y) : await fileIsPixelSold(x, y);
}

export async function markPixelsSold(
  coords: { x: number; y: number }[],
  soldCountAfter: number,
) {
  if (isRedisEnabled()) {
    await redisMarkPixelsSold(coords, soldCountAfter);
  }
  await bumpRevealedEtag(soldCountAfter);
}

export async function clearAllSalesEverywhere() {
  if (isPostgresEnabled()) {
    await pgClearAllSales();
  }
  if (isRedisEnabled()) {
    await redisClearSoldIndex();
  }
  await clearAllSalesFiles();
  await invalidateStatusCache();
}

export async function syncSoldCountCache(count: number) {
  if (isRedisEnabled()) {
    await redisSetSoldCount(count);
  }
  await invalidateStatusCache();
}
