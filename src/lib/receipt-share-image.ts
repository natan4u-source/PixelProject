import { SITE_NAME, SITE_URL } from "@/lib/config";
import { DEFAULT_SIDE, SIDE_INFO, type CanvasSide } from "@/lib/sides";

export type ShareReceiptPixel = {
  x: number;
  y: number;
  color: string;
};

export type ShareReceiptInput = {
  id: string;
  type: "single" | "bulk";
  purchasedAt: string;
  totalInr: number;
  side?: CanvasSide;
  pixels: ShareReceiptPixel[];
};

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;
const PADDING = 36;

type TeamVisual = {
  accent: string;
  accentBright: string;
  accentDim: string;
  gold: string;
  bgTop: string;
  bgMid: string;
  bgBottom: string;
  gridEmpty: string;
  gridGlow: string;
  symbol: string;
  teamBanner: string;
  tagline: string;
  badgeTitle: string;
};

const TEAM_VISUAL: Record<"kamal" | "cockroach", TeamVisual> = {
  kamal: {
    accent: "#ff7a00",
    accentBright: "#ffb347",
    accentDim: "#cc5500",
    gold: "#ffd54f",
    bgTop: "#0a0806",
    bgMid: "#1a1008",
    bgBottom: "#0d0a08",
    gridEmpty: "#1e1a16",
    gridGlow: "rgba(255, 140, 0, 0.55)",
    symbol: "🪷",
    teamBanner: "TEAM KAMAL",
    tagline: "BUILD THE NATION",
    badgeTitle: "FOUNDING WARRIOR",
  },
  cockroach: {
    accent: "#2ee65a",
    accentBright: "#7dffb0",
    accentDim: "#1a9e3d",
    gold: "#b8ff9a",
    bgTop: "#060a08",
    bgMid: "#081a10",
    bgBottom: "#080d0a",
    gridEmpty: "#141a16",
    gridGlow: "rgba(61, 227, 92, 0.5)",
    symbol: "🪳",
    teamBanner: "TEAM COCKROACH",
    tagline: "SPREAD THE ROT",
    badgeTitle: "FOUNDING WARRIOR",
  },
};

function samplePixels(pixels: ShareReceiptPixel[], max: number): ShareReceiptPixel[] {
  if (pixels.length <= max) return pixels;
  const out: ShareReceiptPixel[] = [];
  const step = pixels.length / max;
  for (let i = 0; i < max; i++) {
    out.push(pixels[Math.floor(i * step)]!);
  }
  return out;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawBackground(ctx: CanvasRenderingContext2D, visual: TeamVisual) {
  const bg = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
  bg.addColorStop(0, visual.bgTop);
  bg.addColorStop(0.45, visual.bgMid);
  bg.addColorStop(1, visual.bgBottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  ctx.save();
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 8; i++) {
    const x = 80 + i * 120;
    ctx.fillStyle = visual.accent;
    ctx.beginPath();
    ctx.moveTo(x, CARD_HEIGHT * 0.22);
    ctx.lineTo(x + 30, CARD_HEIGHT * 0.12);
    ctx.lineTo(x + 60, CARD_HEIGHT * 0.22);
    ctx.lineTo(x + 30, CARD_HEIGHT * 0.32);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  for (let i = 0; i < 28; i++) {
    const sx = (i * 97 + 40) % CARD_WIDTH;
    const sy = (i * 131 + 200) % (CARD_HEIGHT - 400);
    const r = 2 + (i % 4);
    ctx.fillStyle = i % 3 === 0 ? visual.accentBright : visual.gold;
    ctx.globalAlpha = 0.25 + (i % 5) * 0.08;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = visual.accent;
  ctx.lineWidth = 5;
  drawRoundedRect(ctx, PADDING, PADDING, CARD_WIDTH - PADDING * 2, CARD_HEIGHT - PADDING * 2, 28);
  ctx.stroke();
}

function drawVictoryTitle(ctx: CanvasRenderingContext2D, visual: TeamVisual, y: number) {
  ctx.textAlign = "center";
  ctx.font = "900 96px Georgia, 'Times New Roman', serif";
  ctx.fillStyle = visual.accent;
  ctx.shadowColor = visual.gridGlow;
  ctx.shadowBlur = 24;
  ctx.fillText("VICTORY!", CARD_WIDTH / 2, y);
  ctx.shadowBlur = 0;

  ctx.font = "600 22px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("★  ONE PIXEL. ONE SOLDIER. ONE NATION.  ★", CARD_WIDTH / 2, y + 44);
}

function drawPurchaseHeadline(ctx: CanvasRenderingContext2D, visual: TeamVisual, count: number, y: number) {
  const countStr = count.toLocaleString("en-IN");
  const prefix = "I BOUGHT ";
  const suffix = count === 1 ? " PIXEL!" : " PIXELS!";

  ctx.textAlign = "left";
  ctx.font = "900 52px system-ui, sans-serif";
  const prefixW = ctx.measureText(prefix).width;
  ctx.font = "900 58px system-ui, sans-serif";
  const countW = ctx.measureText(countStr).width;
  ctx.font = "900 52px system-ui, sans-serif";
  const suffixW = ctx.measureText(suffix).width;
  const totalW = prefixW + countW + suffixW;
  let x = (CARD_WIDTH - totalW) / 2;

  ctx.fillStyle = "#ffffff";
  ctx.fillText(prefix, x, y);
  x += prefixW;

  ctx.fillStyle = visual.accentBright;
  ctx.font = "900 58px system-ui, sans-serif";
  ctx.fillText(countStr, x, y);
  x += countW;

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 52px system-ui, sans-serif";
  ctx.fillText(suffix, x, y);
}

function drawTeamBanner(ctx: CanvasRenderingContext2D, visual: TeamVisual, y: number) {
  const bannerW = 520;
  const bannerH = 56;
  const bx = (CARD_WIDTH - bannerW) / 2;

  ctx.fillStyle = visual.accent;
  ctx.globalAlpha = 0.95;
  drawRoundedRect(ctx, bx, y, bannerW, bannerH, 10);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.textAlign = "center";
  ctx.font = "900 34px system-ui, sans-serif";
  ctx.fillStyle = "#0a0a0a";
  ctx.fillText(`${visual.symbol}  ${visual.teamBanner}  ${visual.symbol}`, CARD_WIDTH / 2, y + 40);

  ctx.font = "600 20px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText(`★  ${visual.tagline}  ★`, CARD_WIDTH / 2, y + bannerH + 32);
}

function drawMiniCanvas(
  ctx: CanvasRenderingContext2D,
  visual: TeamVisual,
  pixels: ShareReceiptPixel[],
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const cols = 22;
  const rows = 14;
  const cellW = w / cols;
  const cellH = h / rows;

  drawRoundedRect(ctx, x, y, w, h, 16);
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fill();
  ctx.strokeStyle = visual.accent;
  ctx.lineWidth = 2;
  ctx.stroke();

  const filled = new Set<string>();
  const sample = samplePixels(pixels, 180);
  for (const px of sample) {
    const col = Math.min(cols - 1, Math.floor((px.x / 1000) * cols));
    const row = Math.min(rows - 1, Math.floor((px.y / 1000) * rows));
    filled.add(`${col},${row}`);
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const key = `${col},${row}`;
      const cx = x + col * cellW + 1;
      const cy = y + row * cellH + 1;
      const cw = cellW - 2;
      const ch = cellH - 2;
      if (filled.has(key)) {
        const px = sample.find((p) => {
          const c = Math.min(cols - 1, Math.floor((p.x / 1000) * cols));
          const r = Math.min(rows - 1, Math.floor((p.y / 1000) * rows));
          return c === col && r === row;
        });
        ctx.fillStyle =
          px && px.color !== "transparent" ? px.color : visual.accentBright;
        ctx.fillRect(cx, cy, cw, ch);
      } else {
        ctx.fillStyle = visual.gridEmpty;
        ctx.fillRect(cx, cy, cw, ch);
      }
    }
  }

  const highlight = pixels[0];
  if (highlight && pixels.length <= 3) {
    const hCol = Math.min(cols - 1, Math.floor((highlight.x / 1000) * cols));
    const hRow = Math.min(rows - 1, Math.floor((highlight.y / 1000) * rows));
    const hx = x + hCol * cellW;
    const hy = y + hRow * cellH;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.strokeRect(hx + 1, hy + 1, cellW - 2, cellH - 2);
    ctx.strokeStyle = visual.accentBright;
    ctx.lineWidth = 5;
    ctx.strokeRect(hx - 2, hy - 2, cellW + 4, cellH + 4);

    ctx.font = "700 28px 'Segoe Print', 'Comic Sans MS', cursive";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText("MY PIXEL", x + w * 0.55, y + h * 0.72);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.52, y + h * 0.68);
    ctx.quadraticCurveTo(x + w * 0.45, y + h * 0.55, hx + cellW / 2, hy + cellH / 2);
    ctx.stroke();
  } else if (pixels.length > 3) {
    ctx.textAlign = "center";
    ctx.font = "700 22px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(`${pixels.length.toLocaleString("en-IN")} pixels claimed`, x + w / 2, y + h - 18);
  }
}

function drawInfoBox(
  ctx: CanvasRenderingContext2D,
  visual: TeamVisual,
  x: number,
  y: number,
  w: number,
  h: number,
  icon: string,
  label: string,
  value: string,
) {
  drawRoundedRect(ctx, x, y, w, h, 12);
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fill();
  ctx.strokeStyle = visual.accent;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = "28px system-ui, Segoe UI Emoji, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(icon, x + 16, y + 38);

  ctx.font = "700 18px system-ui, sans-serif";
  ctx.fillStyle = visual.accentBright;
  ctx.fillText(label, x + 56, y + 28);

  ctx.font = "600 22px system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  const maxW = w - 68;
  let display = value;
  while (ctx.measureText(display).width > maxW && display.length > 4) {
    display = `${display.slice(0, -4)}…`;
  }
  ctx.fillText(display, x + 56, y + 54);
}

function drawBadgeBox(ctx: CanvasRenderingContext2D, visual: TeamVisual, x: number, y: number, w: number, h: number) {
  drawRoundedRect(ctx, x, y, w, h, 12);
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fill();
  ctx.strokeStyle = visual.gold;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = "32px system-ui, Segoe UI Emoji, sans-serif";
  ctx.fillText("🛡️", x + 14, y + 42);

  ctx.font = "700 16px system-ui, sans-serif";
  ctx.fillStyle = visual.gold;
  ctx.fillText("BADGE UNLOCKED", x + 58, y + 26);

  ctx.font = "800 20px system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(visual.badgeTitle, x + 58, y + 52);
}

function drawThankYouBox(ctx: CanvasRenderingContext2D, visual: TeamVisual, x: number, y: number, w: number, h: number) {
  drawRoundedRect(ctx, x, y, w, h, 14);
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fill();
  ctx.strokeStyle = visual.gold;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = "36px system-ui, Segoe UI Emoji, sans-serif";
  ctx.fillText(`${visual.symbol}`, x + 16, y + 44);

  ctx.font = "800 22px system-ui, sans-serif";
  ctx.fillStyle = visual.gold;
  ctx.fillText("THANK YOU,", x + 64, y + 30);
  ctx.fillText("WARRIOR!", x + 64, y + 56);

  ctx.font = "400 14px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  const line = "You are among the early soldiers building internet history.";
  ctx.fillText(line.slice(0, 38), x + 16, y + 82);
  ctx.fillText(line.slice(38), x + 16, y + 100);

  ctx.fillStyle = visual.accent;
  drawRoundedRect(ctx, x + 16, y + h - 36, 140, 26, 8);
  ctx.fill();
  ctx.font = "700 13px system-ui, sans-serif";
  ctx.fillStyle = "#0a0a0a";
  ctx.fillText("★ EARLY SOLDIER", x + 28, y + h - 16);
}

function drawWarCta(ctx: CanvasRenderingContext2D, visual: TeamVisual, cx: number, y: number) {
  ctx.textAlign = "center";
  ctx.font = "900 32px system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("THIS WAR IS NOT OVER!", cx, y);

  ctx.font = "italic 800 28px Georgia, serif";
  ctx.fillStyle = visual.accentBright;
  ctx.fillText("CAN YOUR SIDE WIN?", cx, y + 38);
}

function drawShareIcons(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  const icons: { label: string; bg: string }[] = [
    { label: "WA", bg: "#25D366" },
    { label: "IG", bg: "linear" },
    { label: "X", bg: "#111" },
    { label: "↗", bg: "#444" },
  ];
  const size = 48;
  const gap = (w - icons.length * size) / (icons.length + 1);

  ctx.textAlign = "center";
  ctx.font = "700 16px system-ui, sans-serif";

  icons.forEach((icon, i) => {
    const ix = x + gap + i * (size + gap);
    ctx.beginPath();
    ctx.arc(ix + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    if (icon.bg === "linear") {
      const g = ctx.createLinearGradient(ix, y, ix + size, y + size);
      g.addColorStop(0, "#f58529");
      g.addColorStop(0.5, "#dd2a7b");
      g.addColorStop(1, "#8134af");
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = icon.bg;
    }
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(icon.label, ix + size / 2, y + size / 2 + 6);
  });
}

function drawFooterBar(ctx: CanvasRenderingContext2D, visual: TeamVisual, y: number) {
  const barH = 72;
  drawRoundedRect(ctx, PADDING + 8, y, CARD_WIDTH - (PADDING + 8) * 2, barH, 14);
  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.fill();

  const btnW = 340;
  ctx.fillStyle = visual.accent;
  drawRoundedRect(ctx, PADDING + 24, y + 12, btnW, barH - 24, 10);
  ctx.fill();
  ctx.font = "800 20px system-ui, sans-serif";
  ctx.fillStyle = "#0a0a0a";
  ctx.textAlign = "center";
  ctx.fillText("BUY YOUR PIXEL NOW", PADDING + 24 + btnW / 2, y + 44);

  const urlX = PADDING + 24 + btnW + 20;
  const urlW = CARD_WIDTH - urlX - PADDING - 32;
  drawRoundedRect(ctx, urlX, y + 14, urlW, barH - 28, 10);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.font = "500 22px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText(SITE_NAME, urlX + urlW / 2, y + 44);
}

export function buildReceiptShareCaption(count: number, side: CanvasSide): string {
  const team = SIDE_INFO[side];
  return `I just bought ${count.toLocaleString("en-IN")} ${team.symbol} pixel${count === 1 ? "" : "s"} for ${team.label} on ${SITE_NAME}! Join the live pixel war: ${SITE_URL}`;
}

export async function generateReceiptShareImage(receipt: ShareReceiptInput): Promise<Blob> {
  const side = receipt.side ?? DEFAULT_SIDE;
  const team = SIDE_INFO[side];
  const visual = TEAM_VISUAL[team.color];
  const count = receipt.pixels.length;
  const date = new Date(receipt.purchasedAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const receiptId = receipt.id.slice(0, 8).toUpperCase();

  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create share image.");

  drawBackground(ctx, visual);

  ctx.font = "72px system-ui, Segoe UI Emoji, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(visual.symbol, CARD_WIDTH / 2, 120);

  drawVictoryTitle(ctx, visual, 200);
  drawPurchaseHeadline(ctx, visual, count, 310);
  drawTeamBanner(ctx, visual, 360);

  const midY = 470;
  const gridW = 500;
  const gridH = 320;
  const gridX = PADDING + 20;
  drawMiniCanvas(ctx, visual, receipt.pixels, gridX, midY, gridW, gridH);

  const boxX = gridX + gridW + 24;
  const boxW = CARD_WIDTH - boxX - PADDING - 20;
  const boxH = 72;
  let boxY = midY;
  drawInfoBox(ctx, visual, boxX, boxY, boxW, boxH, "🧾", "PAID", `₹${receipt.totalInr.toLocaleString("en-IN")}`);
  boxY += boxH + 12;
  drawInfoBox(ctx, visual, boxX, boxY, boxW, boxH, "📅", "DATE", date);
  boxY += boxH + 12;
  drawInfoBox(ctx, visual, boxX, boxY, boxW, boxH, "📄", "RECEIPT #", receiptId);
  boxY += boxH + 12;
  drawBadgeBox(ctx, visual, boxX, boxY, boxW, boxH + 8);

  const footerY = midY + gridH + 36;
  const colW = (CARD_WIDTH - PADDING * 2 - 32) / 3;

  drawThankYouBox(ctx, visual, PADDING + 12, footerY, colW - 8, 130);
  drawWarCta(ctx, visual, PADDING + 12 + colW + colW / 2, footerY + 50);
  drawShareIcons(ctx, PADDING + 12 + colW * 2 + 16, footerY + 52, colW - 16);

  ctx.textAlign = "center";
  ctx.font = "700 18px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText("SHARE YOUR VICTORY", PADDING + 12 + colW * 2 + colW / 2, footerY + 28);

  drawFooterBar(ctx, visual, CARD_HEIGHT - PADDING - 88);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not export share image."));
      },
      "image/png",
      1,
    );
  });
}

export function downloadReceiptImage(blob: Blob, filename = "my-pixel-purchase.png") {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function copyShareCaption(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  }
}

export type ShareScreenshotResult = "shared" | "downloaded" | "cancelled";

export async function shareReceiptScreenshot(
  receipt: ShareReceiptInput,
  platform: "facebook" | "instagram" | "whatsapp",
): Promise<ShareScreenshotResult> {
  const side = receipt.side ?? DEFAULT_SIDE;
  const caption = buildReceiptShareCaption(receipt.pixels.length, side);
  const blob = await generateReceiptShareImage(receipt);
  const file = new File([blob], "kamal-vs-cockroach-purchase.png", { type: "image/png" });

  if (typeof navigator.share === "function" && typeof navigator.canShare === "function") {
    try {
      const payload = { files: [file], text: caption, title: "My pixel purchase" };
      if (navigator.canShare(payload)) {
        await navigator.share(payload);
        return "shared";
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return "cancelled";
      }
    }
  }

  downloadReceiptImage(blob);

  if (platform === "facebook") {
    const shareUrl = new URL("https://www.facebook.com/sharer/sharer.php");
    shareUrl.searchParams.set("u", SITE_URL);
    shareUrl.searchParams.set("quote", caption);
    window.open(shareUrl.toString(), "_blank", "noopener,noreferrer,width=600,height=520");
  } else if (platform === "whatsapp") {
    await copyShareCaption(caption);
    const wa = new URL("https://wa.me/");
    wa.searchParams.set("text", `${caption}\n\n(Screenshot saved — attach the downloaded image)`);
    window.open(wa.toString(), "_blank", "noopener,noreferrer");
  } else {
    await copyShareCaption(caption);
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  }

  return "downloaded";
}
