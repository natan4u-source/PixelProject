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

/** Instagram feed — compact share card (content-height) */
const CARD_WIDTH = 1080;
const CARD_HEIGHT = 940;
const PADDING = 32;

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
  rivalAccent: string;
  rivalBright: string;
};

const TEAM_VISUAL: Record<"kamal" | "cockroach", TeamVisual> = {
  kamal: {
    accent: "#ff7a00",
    accentBright: "#ffb347",
    accentDim: "#cc5500",
    gold: "#ffd54f",
    bgTop: "#0a0806",
    bgMid: "#1a1008",
    bgBottom: "#120e0a",
    gridEmpty: "#1e1a16",
    gridGlow: "rgba(255, 140, 0, 0.55)",
    symbol: "🪷",
    teamBanner: "TEAM KAMAL",
    tagline: "BUILD THE NATION",
    badgeTitle: "FOUNDING WARRIOR",
    rivalAccent: "#2ee65a",
    rivalBright: "#7dffb0",
  },
  cockroach: {
    accent: "#2ee65a",
    accentBright: "#7dffb0",
    accentDim: "#1a9e3d",
    gold: "#b8ff9a",
    bgTop: "#060a08",
    bgMid: "#081a10",
    bgBottom: "#0a120e",
    gridEmpty: "#141a16",
    gridGlow: "rgba(61, 227, 92, 0.5)",
    symbol: "🪳",
    teamBanner: "TEAM COCKROACH",
    tagline: "SPREAD THE ROT",
    badgeTitle: "FOUNDING WARRIOR",
    rivalAccent: "#ff7a00",
    rivalBright: "#ffb347",
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
  bg.addColorStop(0.35, visual.bgMid);
  bg.addColorStop(1, visual.bgBottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const glowK = ctx.createRadialGradient(180, 400, 0, 180, 400, 420);
  glowK.addColorStop(0, visual.gridGlow);
  glowK.addColorStop(1, "transparent");
  ctx.fillStyle = glowK;
  ctx.fillRect(0, 0, CARD_WIDTH / 2, CARD_HEIGHT);

  const glowC = ctx.createRadialGradient(900, 700, 0, 900, 700, 480);
  glowC.addColorStop(0, "rgba(61, 227, 92, 0.18)");
  glowC.addColorStop(1, "transparent");
  ctx.fillStyle = glowC;
  ctx.fillRect(CARD_WIDTH / 2, 0, CARD_WIDTH / 2, CARD_HEIGHT);

  ctx.save();
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 14; i++) {
    const x = 40 + i * 72;
    const y = 520 + (i % 3) * 180;
    ctx.fillStyle = i % 2 === 0 ? visual.accent : visual.rivalAccent;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 22, y - 36);
    ctx.lineTo(x + 44, y);
    ctx.lineTo(x + 22, y + 36);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  for (let i = 0; i < 48; i++) {
    const sx = (i * 73 + 20) % CARD_WIDTH;
    const sy = (i * 97 + 80) % CARD_HEIGHT;
    const r = 1.5 + (i % 3);
    ctx.fillStyle = i % 4 === 0 ? visual.accentBright : visual.gold;
    ctx.globalAlpha = 0.2 + (i % 5) * 0.06;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = visual.accent;
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, PADDING, PADDING, CARD_WIDTH - PADDING * 2, CARD_HEIGHT - PADDING * 2, 24);
  ctx.stroke();
}

function drawHeroHeadline(ctx: CanvasRenderingContext2D, visual: TeamVisual, y: number) {
  ctx.textAlign = "center";
  ctx.font = "900 72px Georgia, 'Times New Roman', serif";
  ctx.fillStyle = visual.accent;
  ctx.shadowColor = visual.gridGlow;
  ctx.shadowBlur = 20;
  ctx.fillText("I DID MY PART", CARD_WIDTH / 2, y);
  ctx.shadowBlur = 0;

  ctx.font = "800 26px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText("WE ARE HERE TO WIN", CARD_WIDTH / 2, y + 44);
}

function drawPurchaseHeadline(ctx: CanvasRenderingContext2D, visual: TeamVisual, count: number, y: number) {
  const countStr = count.toLocaleString("en-IN");
  const prefix = "I BOUGHT ";
  const suffix = count === 1 ? " PIXEL!" : " PIXELS!";

  ctx.textAlign = "left";
  ctx.font = "900 44px system-ui, sans-serif";
  const prefixW = ctx.measureText(prefix).width;
  ctx.font = "900 50px system-ui, sans-serif";
  const countW = ctx.measureText(countStr).width;
  ctx.font = "900 44px system-ui, sans-serif";
  const suffixW = ctx.measureText(suffix).width;
  const totalW = prefixW + countW + suffixW;
  let x = (CARD_WIDTH - totalW) / 2;

  ctx.fillStyle = "#ffffff";
  ctx.fillText(prefix, x, y);
  x += prefixW;

  ctx.fillStyle = visual.accentBright;
  ctx.font = "900 50px system-ui, sans-serif";
  ctx.fillText(countStr, x, y);
  x += countW;

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 44px system-ui, sans-serif";
  ctx.fillText(suffix, x, y);
}

function drawTeamBanner(ctx: CanvasRenderingContext2D, visual: TeamVisual, y: number) {
  const bannerW = 480;
  const bannerH = 50;
  const bx = (CARD_WIDTH - bannerW) / 2;

  ctx.fillStyle = visual.accent;
  ctx.globalAlpha = 0.95;
  drawRoundedRect(ctx, bx, y, bannerW, bannerH, 10);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.textAlign = "center";
  ctx.font = "900 30px system-ui, sans-serif";
  ctx.fillStyle = "#0a0a0a";
  ctx.fillText(`${visual.symbol}  ${visual.teamBanner}  ${visual.symbol}`, CARD_WIDTH / 2, y + 35);
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
  const cols = 24;
  const rows = 16;
  const cellW = w / cols;
  const cellH = h / rows;

  drawRoundedRect(ctx, x, y, w, h, 14);
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fill();
  ctx.strokeStyle = visual.accent;
  ctx.lineWidth = 2;
  ctx.stroke();

  const filled = new Set<string>();
  const sample = samplePixels(pixels, 200);
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
        ctx.fillStyle = px && px.color !== "transparent" ? px.color : visual.accentBright;
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
    ctx.lineWidth = 4;
    ctx.strokeRect(hx - 2, hy - 2, cellW + 4, cellH + 4);

    ctx.font = "700 24px 'Segoe Print', 'Comic Sans MS', cursive";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText("MY PIXEL", x + w * 0.52, y + h * 0.7);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y + h * 0.66);
    ctx.quadraticCurveTo(x + w * 0.42, y + h * 0.52, hx + cellW / 2, hy + cellH / 2);
    ctx.stroke();
  } else if (pixels.length > 3) {
    ctx.textAlign = "center";
    ctx.font = "700 20px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.fillText(`${pixels.length.toLocaleString("en-IN")} pixels claimed`, x + w / 2, y + h - 14);
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
  drawRoundedRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fill();
  ctx.strokeStyle = visual.accent;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = "26px system-ui, Segoe UI Emoji, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(icon, x + 14, y + 34);

  ctx.font = "700 16px system-ui, sans-serif";
  ctx.fillStyle = visual.accentBright;
  ctx.fillText(label, x + 50, y + 24);

  ctx.font = "600 20px system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  let display = value;
  const maxW = w - 58;
  while (ctx.measureText(display).width > maxW && display.length > 4) {
    display = `${display.slice(0, -4)}…`;
  }
  ctx.fillText(display, x + 50, y + 48);
}

function drawBadgeBox(ctx: CanvasRenderingContext2D, visual: TeamVisual, x: number, y: number, w: number, h: number) {
  drawRoundedRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fill();
  ctx.strokeStyle = visual.gold;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = "28px system-ui, Segoe UI Emoji, sans-serif";
  ctx.fillText("🛡️", x + 12, y + 36);

  ctx.font = "700 14px system-ui, sans-serif";
  ctx.fillStyle = visual.gold;
  ctx.fillText("BADGE UNLOCKED", x + 52, y + 22);

  ctx.font = "800 18px system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(visual.badgeTitle, x + 52, y + 46);
}

function drawActionRow(
  ctx: CanvasRenderingContext2D,
  visual: TeamVisual,
  y: number,
  w: number,
) {
  const colW = (w - 24) / 3;
  const x0 = PADDING + 12;
  const h = 118;

  drawRoundedRect(ctx, x0, y, colW, h, 12);
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fill();
  ctx.strokeStyle = visual.gold;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = "32px system-ui, Segoe UI Emoji, sans-serif";
  ctx.fillText(visual.symbol, x0 + 14, y + 40);
  ctx.font = "800 18px system-ui, sans-serif";
  ctx.fillStyle = visual.gold;
  ctx.fillText("THANK YOU,", x0 + 54, y + 28);
  ctx.fillText("WARRIOR!", x0 + 54, y + 52);
  ctx.font = "600 12px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.fillText("Early soldier on", x0 + 14, y + 78);
  ctx.fillText("the live canvas", x0 + 14, y + 94);
  ctx.fillStyle = visual.accent;
  drawRoundedRect(ctx, x0 + 14, y + h - 30, 120, 22, 6);
  ctx.fill();
  ctx.font = "700 11px system-ui, sans-serif";
  ctx.fillStyle = "#0a0a0a";
  ctx.fillText("★ EARLY SOLDIER", x0 + 24, y + h - 14);

  const x1 = x0 + colW + 12;
  ctx.textAlign = "center";
  ctx.font = "900 26px system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("WE ARE HERE", x1 + colW / 2, y + 38);
  ctx.fillText("TO WIN", x1 + colW / 2, y + 68);
  ctx.font = "italic 800 20px Georgia, serif";
  ctx.fillStyle = visual.accentBright;
  ctx.fillText("Join the competition →", x1 + colW / 2, y + 98);

  const x2 = x0 + (colW + 12) * 2;
  ctx.font = "700 15px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText("SHARE YOUR", x2 + colW / 2, y + 22);
  ctx.fillText("VICTORY", x2 + colW / 2, y + 42);
  drawShareIcons(ctx, x2 + 8, y + 52, colW - 16);
}

function drawShareIcons(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  const icons: { label: string; bg: string }[] = [
    { label: "WA", bg: "#25D366" },
    { label: "IG", bg: "linear" },
    { label: "X", bg: "#111" },
    { label: "↗", bg: "#444" },
  ];
  const size = 42;
  const gap = (w - icons.length * size) / (icons.length + 1);

  ctx.textAlign = "center";
  ctx.font = "700 14px system-ui, sans-serif";

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
    ctx.fillText(icon.label, ix + size / 2, y + size / 2 + 5);
  });
}

function drawCompetitionStrip(ctx: CanvasRenderingContext2D, visual: TeamVisual, y: number) {
  const x = PADDING + 12;
  const w = CARD_WIDTH - (PADDING + 12) * 2;
  const h = 108;

  drawRoundedRect(ctx, x, y, w, h, 14);
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.font = "800 18px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("THE COMPETITION IS LIVE ON", x + w / 2, y + 28);
  ctx.fillStyle = visual.gold;
  ctx.font = "900 22px system-ui, sans-serif";
  ctx.fillText(SITE_NAME, x + w / 2, y + 54);

  const barY = y + 72;
  const barH = 14;
  const barX = x + 24;
  const barW = w - 48;
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  drawRoundedRect(ctx, barX, barY, barW, barH, 7);
  ctx.fill();

  const kamalShare = 48;
  const kamalW = (barW * kamalShare) / 100;
  const kamalGrad = ctx.createLinearGradient(barX, barY, barX + kamalW, barY);
  kamalGrad.addColorStop(0, "#e07800");
  kamalGrad.addColorStop(1, "#ffc266");
  ctx.fillStyle = kamalGrad;
  drawRoundedRect(ctx, barX, barY, kamalW, barH, 7);
  ctx.fill();

  const cockGrad = ctx.createLinearGradient(barX + kamalW, barY, barX + barW, barY);
  cockGrad.addColorStop(0, "#22b84a");
  cockGrad.addColorStop(1, "#6dff85");
  ctx.fillStyle = cockGrad;
  drawRoundedRect(ctx, barX + kamalW, barY, barW - kamalW, barH, 7);
  ctx.fill();

  ctx.font = "700 13px system-ui, sans-serif";
  ctx.fillStyle = "#ffc266";
  ctx.textAlign = "left";
  ctx.fillText("KAMAL", barX, barY - 6);
  ctx.fillStyle = "#6dff85";
  ctx.textAlign = "right";
  ctx.fillText("COCKROACH", barX + barW, barY - 6);
}

export function buildReceiptShareCaption(count: number, side: CanvasSide): string {
  const team = SIDE_INFO[side];
  return `I did my part — bought ${count.toLocaleString("en-IN")} ${team.symbol} pixel${count === 1 ? "" : "s"} for ${team.label}. We are here to win! ${SITE_URL}`;
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
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create share image.");

  drawBackground(ctx, visual);

  ctx.font = "64px system-ui, Segoe UI Emoji, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(visual.symbol, CARD_WIDTH / 2, 88);

  drawHeroHeadline(ctx, visual, 148);
  drawPurchaseHeadline(ctx, visual, count, 228);
  drawTeamBanner(ctx, visual, 268);

  const midY = 318;
  const gridW = 468;
  const gridH = 296;
  const gridX = PADDING + 12;
  drawMiniCanvas(ctx, visual, receipt.pixels, gridX, midY, gridW, gridH);

  const boxX = gridX + gridW + 20;
  const boxW = CARD_WIDTH - boxX - PADDING - 12;
  const boxH = 72;
  const badgeH = 78;
  const stackH = boxH + 12 + badgeH;
  let boxY = midY + Math.round((gridH - stackH) / 2);
  drawInfoBox(ctx, visual, boxX, boxY, boxW, boxH, "📅", "DATE", date);
  boxY += boxH + 12;
  drawBadgeBox(ctx, visual, boxX, boxY, boxW, badgeH);

  const actionY = midY + gridH + 20;
  drawActionRow(ctx, visual, actionY, CARD_WIDTH - PADDING * 2);

  const stripY = actionY + 132;
  drawCompetitionStrip(ctx, visual, stripY);

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
