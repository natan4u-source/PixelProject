import { promises as fs } from "fs";
import path from "path";
import type { CanvasSide } from "./sides";

const LOCKS_DIR = path.join(process.cwd(), "data", ".locks");
const DEFAULT_TIMEOUT_MS = 30_000;

async function acquireLock(lockPath: string, timeoutMs: number): Promise<fs.FileHandle> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      return await fs.open(lockPath, "wx");
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "EEXIST") throw error;
      await new Promise((resolve) => setTimeout(resolve, 40 + Math.random() * 40));
    }
  }

  throw new Error("Could not acquire file lock in time.");
}

export async function withFileLock<T>(
  lockName: string,
  fn: () => Promise<T>,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  await fs.mkdir(LOCKS_DIR, { recursive: true });
  const lockPath = path.join(LOCKS_DIR, `${lockName.replace(/[^a-zA-Z0-9._-]/g, "_")}.lock`);
  const handle = await acquireLock(lockPath, timeoutMs);

  try {
    return await fn();
  } finally {
    await handle.close();
    await fs.unlink(lockPath).catch(() => {});
  }
}

export function withSidePurchaseLock<T>(
  side: CanvasSide,
  fn: () => Promise<T>,
): Promise<T> {
  return withFileLock(`purchase-${side}`, fn);
}
