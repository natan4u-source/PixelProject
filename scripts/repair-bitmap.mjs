import { createReadStream } from "fs";
import { createInterface } from "readline";
import { promises as fs } from "fs";
import path from "path";

const DATA = path.join(process.cwd(), "data");
const SALES_LOG = path.join(DATA, "sales.ndjson");
const BITMAP_PATH = path.join(DATA, "sold.bitmap");
const SOLD_COUNT = path.join(DATA, "sold.count");
const W = 1000;
const H = 1000;
const TOTAL = W * H;
const BYTE_SIZE = Math.ceil(TOTAL / 8);

const bitmap = Buffer.alloc(BYTE_SIZE, 0);
let count = 0;

const stream = createReadStream(SALES_LOG, { encoding: "utf8" });
const rl = createInterface({ input: stream, crlfDelay: true });

for await (const line of rl) {
  if (!line.trim()) continue;
  const { x, y } = JSON.parse(line);
  if (x < 0 || y < 0 || x >= W || y >= H) continue;
  const index = y * W + x;
  const wasSet = (bitmap[index >> 3] & (1 << (index & 7))) !== 0;
  bitmap[index >> 3] |= 1 << (index & 7);
  if (!wasSet) count++;
}

await fs.writeFile(BITMAP_PATH, bitmap);
await fs.writeFile(SOLD_COUNT, String(count));
console.log(`Repaired bitmap: ${count.toLocaleString()} sold pixels`);
