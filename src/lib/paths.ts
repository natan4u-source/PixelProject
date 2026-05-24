import path from "path";

export const DATA_DIR = path.join(process.cwd(), "data");
export const MASTER_VAULT_PATH = path.join(DATA_DIR, "master.enc");
/** Legacy plaintext path — migrated to master.enc and removed. */
export const LEGACY_MASTER_IMAGE_PATH = path.join(DATA_DIR, "master.png");
/** @deprecated Use MASTER_VAULT_PATH */
export const MASTER_IMAGE_PATH = MASTER_VAULT_PATH;
export const PIXELS_PATH = path.join(DATA_DIR, "pixels.json");
export const PIXELS_BACKUP_PATH = path.join(DATA_DIR, "pixels.backup.json");
export const SALES_LOG_PATH = path.join(DATA_DIR, "sales.ndjson");
export const PURCHASES_LOG_PATH = path.join(DATA_DIR, "purchases.ndjson");
export const PAYMENT_ORDERS_PATH = path.join(DATA_DIR, "payment-orders.json");
export const VISITOR_EVENTS_PATH = path.join(DATA_DIR, "visitor-events.ndjson");
export const META_PATH = path.join(DATA_DIR, "meta.json");
