import { NextResponse } from "next/server";
import { withRedis } from "./redis/client";
import { getClientIp } from "./visitor-meta";

type Bucket = { count: number; resetAt: number };
const localBuckets = new Map<string, Bucket>();

async function consumeLocal(key: string, limit: number, windowSec: number) {
  const now = Date.now();
  const bucket = localBuckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    localBuckets.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { allowed: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count };
}

export async function rateLimit(
  request: Request,
  name: string,
  limit: number,
  windowSec: number,
) {
  const ip = getClientIp(request);
  const key = `rl:${name}:${ip}`;

  const redisResult = await withRedis(async (redis) => {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSec);
    }
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
    };
  });

  if (redisResult) return redisResult;
  return consumeLocal(key, limit, windowSec);
}

export function rateLimitResponse(retryAfterSec = 60) {
  return NextResponse.json(
    { error: "Too many requests. Try again shortly." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    },
  );
}
