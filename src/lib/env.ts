export type PaymentProvider = "cashfree";

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

export function getCashfreeAppId() {
  return process.env.CASHFREE_APP_ID?.trim() || null;
}

export function getCashfreeSecret() {
  return process.env.CASHFREE_SECRET_KEY?.trim() || null;
}

export function getCashfreeApiVersion() {
  return process.env.CASHFREE_API_VERSION?.trim() || "2025-01-01";
}

/** sandbox | production */
export function getCashfreeEnv() {
  const raw = process.env.CASHFREE_ENV?.trim().toLowerCase();
  if (raw === "production" || raw === "prod") return "production";
  return "sandbox";
}

export function isCashfreeEnabled() {
  return Boolean(getCashfreeAppId() && getCashfreeSecret());
}

export function assertCashfreeConfigured() {
  if (!isCashfreeEnabled()) {
    throw new Error("Cashfree is not configured.");
  }
}

export function getActivePaymentProvider(): PaymentProvider | null {
  if (isCashfreeEnabled()) return "cashfree";
  return null;
}

export function isPaymentsEnabled() {
  return isCashfreeEnabled();
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}
