import path from "path";
import type { CanvasSide } from "./sides";

export const DATA_DIR = path.join(process.cwd(), "data");
export const PAYMENT_ORDERS_PATH = path.join(DATA_DIR, "payment-orders.json");
export const VISITOR_EVENTS_PATH = path.join(DATA_DIR, "visitor-events.ndjson");

/** @deprecated Legacy single-canvas paths — use side helpers instead */
export const MASTER_VAULT_PATH = path.join(DATA_DIR, "master.enc");
export const LEGACY_MASTER_IMAGE_PATH = path.join(DATA_DIR, "master.png");
export const PIXELS_PATH = path.join(DATA_DIR, "pixels.json");
export const SALES_LOG_PATH = path.join(DATA_DIR, "sales.ndjson");
export const PURCHASES_LOG_PATH = path.join(DATA_DIR, "purchases.ndjson");
export const META_PATH = path.join(DATA_DIR, "meta.json");

export function sideDataDir(side: CanvasSide) {
  return path.join(DATA_DIR, side);
}

export function masterVaultPath(side: CanvasSide) {
  return path.join(sideDataDir(side), "master.enc");
}

export function legacyMasterImagePath(side: CanvasSide) {
  return path.join(sideDataDir(side), "master.png");
}

export function pixelsPath(side: CanvasSide) {
  return path.join(sideDataDir(side), "pixels.json");
}

export function pixelsBackupPath(side: CanvasSide) {
  return path.join(sideDataDir(side), "pixels.backup.json");
}

export function salesLogPath(side: CanvasSide) {
  return path.join(sideDataDir(side), "sales.ndjson");
}

export function purchasesLogPath(side: CanvasSide) {
  return path.join(sideDataDir(side), "purchases.ndjson");
}

export function metaPath(side: CanvasSide) {
  return path.join(sideDataDir(side), "meta.json");
}

export function soldBitmapPath(side: CanvasSide) {
  return path.join(sideDataDir(side), "sold.bitmap");
}

export function soldCountPath(side: CanvasSide) {
  return path.join(sideDataDir(side), "sold.count");
}

export function migratedFlagPath(side: CanvasSide) {
  return path.join(sideDataDir(side), ".migrated");
}

export function revealedImagePath(side: CanvasSide) {
  return path.join(sideDataDir(side), "revealed.png");
}
