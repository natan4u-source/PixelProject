import { promises as fs } from "fs";
import path from "path";
import { DATA_DIR, sideDataDir } from "./paths";
import { DEFAULT_SIDE } from "./sides";

const LEGACY_FILES = [
  "master.enc",
  "master.png",
  "revealed.png",
  "revealed.png.tmp",
  "sold.bitmap",
  "sold.bitmap.tmp",
  "sales.ndjson",
  "purchases.ndjson",
  "meta.json",
  "sold.count",
  ".migrated",
  "pixels.json",
  "pixels.backup.json",
  "pixels.json.tmp",
];

let layoutPromise: Promise<void> | null = null;

/** Move legacy single-canvas data/ files into data/a/ on first run. */
export async function ensureDualSideLayout() {
  if (layoutPromise) return layoutPromise;

  layoutPromise = (async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(sideDataDir("a"), { recursive: true });
    await fs.mkdir(sideDataDir("b"), { recursive: true });

    const targetDir = sideDataDir(DEFAULT_SIDE);
    let movedAny = false;

    for (const file of LEGACY_FILES) {
      const from = path.join(DATA_DIR, file);
      const to = path.join(targetDir, file);
      try {
        await fs.access(from);
      } catch {
        continue;
      }

      try {
        await fs.access(to);
        continue;
      } catch {
        // target missing — safe to move
      }

      await fs.rename(from, to);
      movedAny = true;
    }

    if (movedAny) {
      console.log(`Migrated legacy canvas data to ${targetDir}`);
    }
  })();

  return layoutPromise;
}
