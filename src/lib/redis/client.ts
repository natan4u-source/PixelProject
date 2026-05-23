import Redis from "ioredis";
import { getRedisUrl } from "../env";

let client: Redis | null = null;

export function getRedis() {
  const url = getRedisUrl();
  if (!url) {
    throw new Error("REDIS_URL is not configured.");
  }

  if (!client) {
    client = new Redis(url, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: true,
    });
  }

  return client;
}

export async function withRedis<T>(
  fn: (redis: Redis) => Promise<T>,
): Promise<T | null> {
  if (!getRedisUrl()) return null;
  const redis = getRedis();
  if (redis.status === "wait") {
    await redis.connect();
  }
  return fn(redis);
}
