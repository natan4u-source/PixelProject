import { promises as fs } from "fs";
import path from "path";

const DATA = path.join(process.cwd(), "data");
const W = 1000;
const H = 1000;
const TOTAL = W * H;
const BYTE_SIZE = Math.ceil(TOTAL / 8);

const toDelete = [
  "pixels.json",
  "pixels.backup.json",
  "sales.ndjson",
  "purchases.ndjson",
  "pixels.json.tmp",
  "sold.bitmap",
  "sold.bitmap.tmp",
  "revealed.png",
  "revealed.png.tmp",
  ".migrated",
  "sold.count",
];

for (const name of toDelete) {
  try {
    await fs.unlink(path.join(DATA, name));
    console.log("Deleted", name);
  } catch {
    // skip
  }
}

const bitmap = Buffer.alloc(BYTE_SIZE, 0);
await fs.writeFile(path.join(DATA, "sold.bitmap"), bitmap);
await fs.writeFile(path.join(DATA, "sold.count"), "0");
console.log("Reset complete — 0 pixels sold. Restart npm run dev and refresh the site.");
