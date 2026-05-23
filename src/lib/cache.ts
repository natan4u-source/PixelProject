import { withRedis } from "./redis/client";
import { getStatusCacheTtlSec } from "./env";

const STATUS_KEY = "cache:status:json";
const REVEALED_ETAG_KEY = "cache:revealed:etag";

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

export async function getCachedStatus(): Promise<string | null> {
  const redisValue = await withRedis(async (redis) => redis.get(STATUS_KEY));
  if (redisValue) return redisValue;
  return memoryGet(STATUS_KEY);
}

export async function setCachedStatus(json: string, ttlSec = getStatusCacheTtlSec()) {
  await withRedis(async (redis) => {
    await redis.set(STATUS_KEY, json, "EX", ttlSec);
  });
  memorySet(STATUS_KEY, json, ttlSec);
}

export async function invalidateStatusCache() {
  await withRedis(async (redis) => {
    await redis.del(STATUS_KEY);
  });
  memoryDel(STATUS_KEY);
}

export async function getRevealedEtag(): Promise<string | null> {
  const redisValue = await withRedis(async (redis) => redis.get(REVEALED_ETAG_KEY));
  if (redisValue) return redisValue;
  return memoryGet(REVEALED_ETAG_KEY);
}

export async function setRevealedEtag(etag: string) {
  await withRedis(async (redis) => {
    await redis.set(REVEALED_ETAG_KEY, etag);
  });
  memorySet(REVEALED_ETAG_KEY, etag, 86_400);
}

export async function bumpRevealedEtag(soldCount: number) {
  const etag = `"${soldCount}-${Date.now()}"`;
  await setRevealedEtag(etag);
  await invalidateStatusCache();
  return etag;
}
