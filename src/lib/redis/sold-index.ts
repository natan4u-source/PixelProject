import { GRID_WIDTH } from "../config";
import { withRedis } from "./client";

const BITMAP_KEY = "pixel:sold:bitmap";
const COUNT_KEY = "pixel:sold:count";

function pixelIndex(x: number, y: number) {
  return y * GRID_WIDTH + x;
}

export async function redisMarkPixelsSold(
  coords: { x: number; y: number }[],
  soldCountAfter?: number,
) {
  if (coords.length === 0) return;

  await withRedis(async (redis) => {
    const pipeline = redis.pipeline();
    for (const { x, y } of coords) {
      pipeline.setbit(BITMAP_KEY, pixelIndex(x, y), 1);
    }
    if (soldCountAfter !== undefined) {
      pipeline.set(COUNT_KEY, String(soldCountAfter));
    } else {
      pipeline.incrby(COUNT_KEY, coords.length);
    }
    await pipeline.exec();
  });
}

export async function redisIsPixelSold(x: number, y: number): Promise<boolean | null> {
  return withRedis(async (redis) => {
    const bit = await redis.getbit(BITMAP_KEY, pixelIndex(x, y));
    return bit === 1;
  });
}

export async function redisGetSoldCount(): Promise<number | null> {
  return withRedis(async (redis) => {
    const raw = await redis.get(COUNT_KEY);
    if (raw === null) return null;
    const count = parseInt(raw, 10);
    return Number.isFinite(count) && count >= 0 ? count : null;
  });
}

export async function redisSetSoldCount(count: number) {
  await withRedis(async (redis) => {
    await redis.set(COUNT_KEY, String(count));
  });
}

export async function redisClearSoldIndex() {
  await withRedis(async (redis) => {
    await redis.del(BITMAP_KEY, COUNT_KEY);
  });
}

export async function redisSyncBitmapFromBuffer(bitmap: Buffer) {
  await withRedis(async (redis) => {
    await redis.set(BITMAP_KEY, bitmap);
  });
}
