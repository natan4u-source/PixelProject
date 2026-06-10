import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const SOURCE = path.join(
  root,
  "assets",
  "screenshot-battle-dashboard.png"
);
const OUT_DIR = path.join(root, "assets");

/** Instagram feed portrait 4:5 */
const W = 1080;
const H = 1350;

/** Instagram square */
const SQ = 1080;

/** Instagram story 9:16 */
const STORY_W = 1080;
const STORY_H = 1920;

const BG = { r: 26, g: 26, b: 46 }; // --bg #1a1a2e

async function fitOnCanvas(input, outPath, canvasW, canvasH, padRatio = 0.06) {
  const meta = await sharp(input).metadata();
  const padX = Math.round(canvasW * padRatio);
  const padY = Math.round(canvasH * padRatio);
  const maxW = canvasW - padX * 2;
  const maxH = canvasH - padY * 2;

  const scale = Math.min(maxW / meta.width, maxH / meta.height);
  const resizedW = Math.round(meta.width * scale);
  const resizedH = Math.round(meta.height * scale);

  const screenshot = await sharp(input)
    .resize(resizedW, resizedH, { fit: "inside", kernel: "lanczos3" })
    .png()
    .toBuffer();

  const left = Math.round((canvasW - resizedW) / 2);
  const top = Math.round((canvasH - resizedH) / 2);

  const footerH = 72;
  const footerSvg = Buffer.from(`
<svg width="${canvasW}" height="${footerH}" xmlns="http://www.w3.org/2000/svg">
  <text x="50%" y="46" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="#ffc266">kamalvscockroach.com</text>
</svg>`);

  const footer = await sharp(footerSvg).png().toBuffer();

  const contentTop = Math.round(Math.max(padY, top - 8));
  const footerTop = Math.round(canvasH - footerH - padY / 2);
  const composite = [
    { input: screenshot, left, top: contentTop },
    { input: footer, left: 0, top: footerTop },
  ];

  await sharp({
    create: {
      width: canvasW,
      height: canvasH,
      channels: 3,
      background: BG,
    },
  })
    .composite(composite)
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  console.log("Wrote", outPath, `${canvasW}x${canvasH}`);
}

async function main() {
  const portrait = path.join(OUT_DIR, "instagram-battle-post-4x5.png");
  const square = path.join(OUT_DIR, "instagram-battle-post-square.png");
  const story = path.join(OUT_DIR, "instagram-battle-post-story.png");

  await fitOnCanvas(SOURCE, portrait, W, H, 0.05);
  await fitOnCanvas(SOURCE, square, SQ, SQ, 0.04);
  await fitOnCanvas(SOURCE, story, STORY_W, STORY_H, 0.08);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
