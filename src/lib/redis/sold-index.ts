import { GRID_WIDTH } from "../config";
import { withRedis } from "./client";
import type { CanvasSide } from "../sides";

function bitmapKey(side: CanvasSide) {
  return `pixel:${side}:sold:bitmap`;
}

function countKey(side: CanvasSide) {
  return `pixel:${side}:sold:count`;
}

function pixelIndex(x: number, y: number) {
  return y * GRID_WIDTH + x;
}

export async function redisMarkPixelsSold(
  side: CanvasSide,
  coords: { x: number; y: number }[],
  soldCountAfter?: number,
) {
  if (coords.length === 0) return;

  await withRedis(async (redis) => {
    const pipeline = redis.pipeline();
    for (const { x, y } of coords) {
      pipeline.setbit(bitmapKey(side), pixelIndex(x, y), 1);
    }
    if (soldCountAfter !== undefined) {
      pipeline.set(countKey(side), String(soldCountAfter));
    } else {
      pipeline.incrby(countKey(side), coords.length);
    }
    await pipeline.exec();
  });
}

export async function redisIsPixelSold(
  side: CanvasSide,
  x: number,
  y: number,
): Promise<boolean | null> {
  return withRedis(async (redis) => {
    const bit = await redis.getbit(bitmapKey(side), pixelIndex(x, y));
    return bit === 1;
  });
}

export async function redisGetSoldCount(side: CanvasSide): Promise<number | null> {
  return withRedis(async (redis) => {
    const raw = await redis.get(countKey(side));
    if (raw === null) return null;
    const count = parseInt(raw, 10);
    return Number.isFinite(count) && count >= 0 ? count : null;
  });
}

export async function redisSetSoldCount(side: CanvasSide, count: number) {
  await withRedis(async (redis) => {
    await redis.set(countKey(side), String(count));
  });
}

export async function redisClearSoldIndex(side: CanvasSide) {
  await withRedis(async (redis) => {
    await redis.del(bitmapKey(side), countKey(side));
  });
}

export async function redisSyncBitmapFromBuffer(side: CanvasSide, bitmap: Buffer) {
  await withRedis(async (redis) => {
    await redis.set(bitmapKey(side), bitmap);
  });
}
