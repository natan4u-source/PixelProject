"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_SIDE, SIDE_INFO, type CanvasSide } from "@/lib/sides";
import {
  buildReceiptShareCaption,
  downloadReceiptImage,
  generateReceiptShareImage,
  shareReceiptScreenshot,
  type ShareScreenshotResult,
} from "@/lib/receipt-share-image";

export type ReceiptPixel = {
  x: number;
  y: number;
  color: string;
};

export type PurchaseReceiptData = {
  id: string;
  type: "single" | "bulk";
  purchasedAt: string;
  totalInr: number;
  side?: CanvasSide;
  pixels: ReceiptPixel[];
};

type Props = {
  receipt: PurchaseReceiptData | null;
  onClose: () => void;
};

type ShareStatus = {
  platform: "facebook" | "instagram" | null;
  result: ShareScreenshotResult | "loading" | "error" | "idle";
  message?: string;
};

export function PurchaseReceipt({ receipt, onClose }: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [shareStatus, setShareStatus] = useState<ShareStatus>({ platform: null, result: "idle" });

  const buildPreview = useCallback(async (data: PurchaseReceiptData) => {
    setPreviewLoading(true);
    try {
      const blob = await generateReceiptShareImage(data);
      const url = URL.createObjectURL(blob);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!receipt) {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setShareStatus({ platform: null, result: "idle" });
      return;
    }

    setShowDetails(false);
    setShareStatus({ platform: null, result: "idle" });
    void buildPreview(receipt);

    return () => {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [receipt, buildPreview]);

  if (!receipt) return null;

  const side = receipt.side ?? DEFAULT_SIDE;
  const team = SIDE_INFO[side];
  const count = receipt.pixels.length;
  const isKamal = side === "a";
  const accentClass = isKamal ? "text-[var(--kamal)]" : "text-[var(--cockroach)]";
  const accentBg = isKamal ? "bg-[var(--kamal)]" : "bg-[var(--cockroach)]";
  const panelBorder = isKamal ? "border-[var(--kamal)]/40" : "border-[var(--cockroach)]/40";
  const panelGlow = isKamal ? "shadow-[0_0_40px_var(--kamal-glow)]" : "shadow-[0_0_40px_var(--cockroach-glow)]";

  const date = new Date(receipt.purchasedAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const shortId = receipt.id.slice(0, 8).toUpperCase();

  const statusMessage = (() => {
    if (shareStatus.result === "loading" && shareStatus.platform) {
      return "Preparing your screenshot…";
    }
    if (shareStatus.result === "shared") {
      return shareStatus.platform === "instagram"
        ? "Screenshot shared! Pick Instagram in the share menu to post."
        : "Screenshot shared! Pick Facebook in the share menu to post.";
    }
    if (shareStatus.result === "downloaded") {
      if (shareStatus.message) return shareStatus.message;
      return shareStatus.platform === "instagram"
        ? "Screenshot saved and caption copied. Open Instagram → create post → upload the image → paste caption."
        : "Screenshot saved to your device. Upload it on Facebook when you share.";
    }
    if (shareStatus.result === "cancelled") {
      return "Share cancelled.";
    }
    if (shareStatus.result === "error") {
      return shareStatus.message ?? "Could not share. Try downloading the screenshot.";
    }
    return null;
  })();

  const handleShare = async (platform: "facebook" | "instagram") => {
    setShareStatus({ platform, result: "loading" });
    try {
      const result = await shareReceiptScreenshot(receipt, platform);
      setShareStatus({ platform, result });
      if (result !== "cancelled") {
        window.setTimeout(() => setShareStatus({ platform: null, result: "idle" }), 6000);
      } else {
        setShareStatus({ platform: null, result: "idle" });
      }
    } catch (error) {
      setShareStatus({
        platform,
        result: "error",
        message: error instanceof Error ? error.message : "Share failed.",
      });
      window.setTimeout(() => setShareStatus({ platform: null, result: "idle" }), 5000);
    }
  };

  const handleDownloadScreenshot = async () => {
    setShareStatus({ platform: null, result: "idle" });
    try {
      const blob = await generateReceiptShareImage(receipt);
      downloadReceiptImage(blob);
      setShareStatus({
        platform: null,
        result: "downloaded",
        message: "Screenshot saved to your device.",
      });
      window.setTimeout(() => setShareStatus({ platform: null, result: "idle" }), 4000);
    } catch (error) {
      setShareStatus({
        platform: null,
        result: "error",
        message: error instanceof Error ? error.message : "Download failed.",
      });
    }
  };

  const sharing = shareStatus.result === "loading" && shareStatus.platform !== null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-title"
    >
      <div
        className={`flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border bg-[var(--surface)] shadow-2xl ${panelBorder} ${panelGlow}`}
      >
        <div className="border-b border-[var(--border)] px-6 py-6 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">Victory!</p>
          <h2 id="receipt-title" className="mt-2 text-3xl font-bold sm:text-4xl">
            You bought {count.toLocaleString("en-IN")}
          </h2>
          <p className="mt-3 text-6xl leading-none sm:text-7xl" aria-hidden="true">
            {team.symbol}
          </p>
          <p className={`mt-3 text-lg font-semibold uppercase tracking-wide ${accentClass}`}>
            {team.label}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {count === 1 ? "Your pixel is" : "Your pixels are"} now part of the battle
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Share screenshot
          </p>
          <p className="mt-1 text-center text-xs text-white/45">
            Post your purchase card on Instagram or Facebook
          </p>

          <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/40">
            {previewLoading && (
              <div className="flex aspect-[4/5] items-center justify-center text-sm text-[var(--muted)]">
                Creating preview…
              </div>
            )}
            {!previewLoading && previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- blob URL from canvas export
              <img
                src={previewUrl}
                alt="Your purchase screenshot to share on social media"
                className="aspect-[4/5] w-full object-cover"
              />
            )}
            {!previewLoading && !previewUrl && (
              <div className="flex aspect-[4/5] items-center justify-center px-4 text-center text-sm text-[var(--muted)]">
                Preview unavailable — you can still share or download.
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={sharing}
              onClick={() => handleShare("facebook")}
              className="flex items-center justify-center gap-2 rounded-lg border border-[#1877f2]/50 bg-[#1877f2]/10 py-3 text-sm font-semibold text-[#6eb0ff] transition hover:bg-[#1877f2]/20 disabled:opacity-50"
            >
              <FacebookIcon />
              {sharing && shareStatus.platform === "facebook" ? "Sharing…" : "Facebook"}
            </button>
            <button
              type="button"
              disabled={sharing}
              onClick={() => handleShare("instagram")}
              className="flex items-center justify-center gap-2 rounded-lg border border-[#e1306c]/50 bg-gradient-to-br from-[#f58529]/10 via-[#dd2a7b]/10 to-[#8134af]/10 py-3 text-sm font-semibold text-[#f77737] transition hover:brightness-110 disabled:opacity-50"
            >
              <InstagramIcon />
              {sharing && shareStatus.platform === "instagram" ? "Sharing…" : "Instagram"}
            </button>
          </div>

          <button
            type="button"
            disabled={sharing}
            onClick={() => void handleDownloadScreenshot()}
            className="mt-3 w-full rounded-lg border border-white/15 py-2.5 text-sm text-white/70 transition hover:border-white/30 hover:text-white disabled:opacity-50"
          >
            Download screenshot
          </button>

          {statusMessage && (
            <p className="mt-3 text-center text-xs leading-relaxed text-[var(--muted)]" role="status">
              {statusMessage}
            </p>
          )}

          <p className="mt-2 text-center text-[10px] leading-relaxed text-white/35">
            On phone: tap Facebook or Instagram to open the share menu with your screenshot. On
            desktop: the image downloads — upload it when you post.
          </p>
        </div>

        <div className="mx-6 border-t border-dashed border-[var(--border)]" />

        <div className="px-6 py-3">
          <button
            type="button"
            onClick={() => setShowDetails((open) => !open)}
            className="flex w-full items-center justify-between text-sm text-[var(--muted)] hover:text-[var(--text)]"
            aria-expanded={showDetails}
          >
            <span>Receipt details</span>
            <span aria-hidden="true">{showDetails ? "−" : "+"}</span>
          </button>
        </div>

        {showDetails && (
          <>
            <div className="space-y-3 px-6 pb-4 text-sm">
              <ReceiptRow label="Receipt #" value={shortId} mono />
              <ReceiptRow label="Date" value={date} />
              <ReceiptRow
                label="Type"
                value={receipt.type === "bulk" ? "Random bulk buy" : "Single pixel"}
              />
              <ReceiptRow label="Team" value={team.label} />
              <ReceiptRow
                label="Total paid"
                value={`₹${receipt.totalInr.toLocaleString("en-IN")}`}
                highlight
              />
              <ReceiptRow
                label="Caption"
                value={buildReceiptShareCaption(count, side)}
              />
            </div>

            <div className="min-h-0 flex-1 px-6 pb-4">
              <p className="mb-3 text-xs uppercase tracking-wide text-[var(--muted)]">
                Your pixel{count === 1 ? "" : "s"}
              </p>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg)]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[var(--bg)]">
                    <tr className="text-left text-xs text-[var(--muted)]">
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Position</th>
                      <th className="px-3 py-2">Color</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.pixels.map((pixel, i) => (
                      <tr key={`${pixel.x},${pixel.y}`} className="border-t border-[var(--border)]/40">
                        <td className="px-3 py-2 text-[var(--muted)]">{i + 1}</td>
                        <td className="px-3 py-2 font-mono">
                          ({pixel.x}, {pixel.y})
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="inline-block h-4 w-4 shrink-0 rounded border border-[var(--border)]"
                              style={{ backgroundColor: pixel.color }}
                            />
                            <span className="font-mono text-xs">{pixel.color}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <div className="border-t border-[var(--border)] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className={`w-full rounded-lg py-3 font-semibold text-black ${accentBg} hover:brightness-110`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-[var(--muted)]">{label}</span>
      <span
        className={`text-right ${mono ? "font-mono text-xs" : "text-sm"} ${highlight ? "font-semibold text-[var(--accent)]" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function FacebookIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}
