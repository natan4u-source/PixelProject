export function getDatabaseUrl() {
  return process.env.DATABASE_URL?.trim() || null;
}

export function getRedisUrl() {
  return process.env.REDIS_URL?.trim() || null;
}

export function isPostgresEnabled() {
  return Boolean(getDatabaseUrl());
}

export function isRedisEnabled() {
  return Boolean(getRedisUrl());
}

export function getStatusCacheTtlSec() {
  const raw = parseInt(process.env.STATUS_CACHE_TTL_SEC ?? "15", 10);
  return Number.isFinite(raw) && raw >= 1 ? raw : 15;
}

export function getRevealedCacheMaxAgeSec() {
  const raw = parseInt(process.env.REVEALED_CACHE_MAX_AGE_SEC ?? "60", 10);
  return Number.isFinite(raw) && raw >= 0 ? raw : 60;
}
