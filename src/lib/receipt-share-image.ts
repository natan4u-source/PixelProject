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
const CARD_HEIGHT = 1350;

const TEAM_THEME = {
  kamal: {
    gradient: ["#1a1208", "#3d2810", "#1a1208"] as const,
    accent: "#ff9f1a",
    accentBright: "#ffd54f",
    glow: "rgba(255, 159, 26, 0.35)",
  },
  cockroach: {
    gradient: ["#081a0e", "#103d22", "#081a0e"] as const,
    accent: "#3de35c",
    accentBright: "#7dffb0",
    glow: "rgba(61, 227, 92, 0.35)",
  },
} as const;

function samplePixels(pixels: ShareReceiptPixel[], max: number): ShareReceiptPixel[] {
  if (pixels.length <= max) return pixels;
  const out: ShareReceiptPixel[] = [];
  const step = pixels.length / max;
  for (let i = 0; i < max; i++) {
    out.push(pixels[Math.floor(i * step)]!);
  }
  return out;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
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

function drawPixelMosaic(
  ctx: CanvasRenderingContext2D,
  pixels: ShareReceiptPixel[],
  x: number,
  y: number,
  size: number,
) {
  const sample = samplePixels(pixels, 64);
  const cols = Math.ceil(Math.sqrt(sample.length));
  const rows = Math.ceil(sample.length / cols);
  const cell = size / Math.max(cols, rows, 1);
  const gridW = cols * cell;
  const gridH = rows * cell;
  const startX = x + (size - gridW) / 2;
  const startY = y + (size - gridH) / 2;

  ctx.save();
  drawRoundedRect(ctx, startX - 12, startY - 12, gridW + 24, gridH + 24, 16);
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 2;
  ctx.stroke();

  for (let i = 0; i < sample.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const px = sample[i]!;
    ctx.fillStyle = px.color === "transparent" ? "#1c1c28" : px.color;
    ctx.fillRect(startX + col * cell, startY + row * cell, cell - 1, cell - 1);
  }
  ctx.restore();
}

export function buildReceiptShareCaption(count: number, side: CanvasSide): string {
  const team = SIDE_INFO[side];
  return `I just bought ${count.toLocaleString("en-IN")} ${team.symbol} pixel${count === 1 ? "" : "s"} for ${team.label} on ${SITE_NAME}! Join the live pixel war: ${SITE_URL}`;
}

export async function generateReceiptShareImage(receipt: ShareReceiptInput): Promise<Blob> {
  const side = receipt.side ?? DEFAULT_SIDE;
  const team = SIDE_INFO[side];
  const theme = TEAM_THEME[team.color];
  const count = receipt.pixels.length;
  const date = new Date(receipt.purchasedAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create share image.");

  const bg = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  bg.addColorStop(0, theme.gradient[0]);
  bg.addColorStop(0.5, theme.gradient[1]);
  bg.addColorStop(1, theme.gradient[2]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  ctx.strokeStyle = theme.glow;
  ctx.lineWidth = 6;
  drawRoundedRect(ctx, 48, 48, CARD_WIDTH - 96, CARD_HEIGHT - 96, 32);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "600 28px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("VICTORY!", CARD_WIDTH / 2, 130);

  ctx.font = "900 120px system-ui, Segoe UI Emoji, Apple Color Emoji, sans-serif";
  ctx.fillText(team.symbol, CARD_WIDTH / 2, 280);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 56px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(`I bought ${count.toLocaleString("en-IN")} pixel${count === 1 ? "" : "s"}!`, CARD_WIDTH / 2, 380);

  ctx.fillStyle = theme.accentBright;
  ctx.font = "700 44px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(team.label.toUpperCase(), CARD_WIDTH / 2, 450);

  ctx.fillStyle = theme.accent;
  ctx.font = "600 32px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(team.tagline, CARD_WIDTH / 2, 510);

  const mosaicSize = count === 1 ? 280 : 420;
  const mosaicY = count === 1 ? 560 : 540;
  if (count === 1 && receipt.pixels[0]) {
    const px = receipt.pixels[0];
    const box = mosaicSize;
    const bx = (CARD_WIDTH - box) / 2;
    ctx.fillStyle = px.color === "transparent" ? "#1c1c28" : px.color;
    drawRoundedRect(ctx, bx, mosaicY, box, box, 20);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "500 28px ui-monospace, monospace";
    ctx.fillText(`(${px.x}, ${px.y})`, CARD_WIDTH / 2, mosaicY + box + 48);
  } else {
    drawPixelMosaic(ctx, receipt.pixels, (CARD_WIDTH - mosaicSize) / 2, mosaicY, mosaicSize);
  }

  const detailsY = count === 1 ? 960 : 1020;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "500 30px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(`Paid ₹${receipt.totalInr.toLocaleString("en-IN")}`, CARD_WIDTH / 2, detailsY);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "400 26px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(date, CARD_WIDTH / 2, detailsY + 44);
  ctx.fillText(`Receipt #${receipt.id.slice(0, 8).toUpperCase()}`, CARD_WIDTH / 2, detailsY + 88);

  ctx.fillStyle = theme.accentBright;
  ctx.font = "700 38px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("KAMAL vs COCKROACH", CARD_WIDTH / 2, CARD_HEIGHT - 160);

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "500 28px system-ui, -apple-system, Segoe UI, sans-serif";
  const urlLines = wrapText(ctx, SITE_URL.replace(/^https?:\/\//, ""), CARD_WIDTH - 160);
  urlLines.forEach((line, i) => {
    ctx.fillText(line, CARD_WIDTH / 2, CARD_HEIGHT - 100 + i * 36);
  });

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
  platform: "facebook" | "instagram",
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
  } else {
    await copyShareCaption(caption);
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  }

  return "downloaded";
}
