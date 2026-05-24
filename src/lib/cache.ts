import { withRedis } from "./redis/client";
import { getStatusCacheTtlSec } from "./env";
import type { CanvasSide } from "./sides";

function statusKey(side: CanvasSide) {
  return `cache:status:${side}:json`;
}

function revealedEtagKey(side: CanvasSide) {
  return `cache:revealed:${side}:etag`;
}

type MemoryEntry = { value: string; expiresAt: number };
const memoryCache = new Map<string, MemoryEntry>();

function memoryGet(key: string) {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
}

function memorySet(key: string, value: string, ttlSec: number) {
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlSec * 1000 });
}

function memoryDel(key: string) {
  memoryCache.delete(key);
}

export async function getCachedStatus(side: CanvasSide): Promise<string | null> {
  const key = statusKey(side);
  const redisValue = await withRedis(async (redis) => redis.get(key));
  if (redisValue) return redisValue;
  return memoryGet(key);
}

export async function setCachedStatus(side: CanvasSide, json: string, ttlSec = getStatusCacheTtlSec()) {
  const key = statusKey(side);
  await withRedis(async (redis) => {
    await redis.set(key, json, "EX", ttlSec);
  });
  memorySet(key, json, ttlSec);
}

export async function invalidateStatusCache(side?: CanvasSide) {
  if (side) {
    const key = statusKey(side);
    await withRedis(async (redis) => {
      await redis.del(key);
    });
    memoryDel(key);
    return;
  }

  for (const s of ["a", "b"] as const) {
    await invalidateStatusCache(s);
  }
}

export async function getRevealedEtag(side: CanvasSide): Promise<string | null> {
  const key = revealedEtagKey(side);
  const redisValue = await withRedis(async (redis) => redis.get(key));
  if (redisValue) return redisValue;
  return memoryGet(key);
}

export async function setRevealedEtag(side: CanvasSide, etag: string) {
  const key = revealedEtagKey(side);
  await withRedis(async (redis) => {
    await redis.set(key, etag);
  });
  memorySet(key, etag, 86_400);
}

export async function bumpRevealedEtag(side: CanvasSide, soldCount: number) {
  const etag = `"${soldCount}-${Date.now()}"`;
  await setRevealedEtag(side, etag);
  await invalidateStatusCache(side);
  return etag;
}
