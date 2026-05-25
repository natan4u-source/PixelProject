"use client";

import { TaxDisclaimer } from "@/components/TaxDisclaimer";
import type { CanvasSide } from "@/lib/sides";

type Props = {
  side?: CanvasSide;
  sideLabel?: string;
  x: number;
  y: number;
  priceLabel: string;
  isSold: boolean;
  ready: boolean;
  loading: boolean;
  paymentsEnabled?: boolean;
  onBuy: () => void;
  onClear: () => void;
};

export function PurchasePanel({
  side,
  sideLabel,
  x,
  y,
  priceLabel,
  isSold,
  ready,
  loading,
  paymentsEnabled = false,
  onBuy,
  onClear,
}: Props) {
  const isKamal = side === "a" || sideLabel?.toLowerCase().includes("canvas a") === true;

  return (
    <div className="rounded-xl border border-white/10 bg-[var(--surface-elevated)] p-5 shadow-xl">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
        {sideLabel ? `${sideLabel} · selected pixel` : "Selected pixel"}
      </p>
      <p className="mt-1 font-mono text-2xl">
        ({x}, {y})
      </p>

      {!ready && (
        <p className="mt-4 text-sm text-amber-300">
          The hidden image is not live yet. Check back soon.
        </p>
      )}

      {ready && isSold && (
        <>
          <p className="mt-4 text-sm text-emerald-400">This pixel is already revealed.</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Its true color is visible on the grid. Pick a dark pixel to buy another.
          </p>
        </>
      )}

      {ready && !isSold && (
        <>
          <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
            Buy this pixel to permanently reveal that spot on the public canvas and add to the collective image.
          </p>
          <p
            className={`mt-3 text-lg font-semibold ${isKamal ? "text-[var(--kamal)]" : "text-[var(--cockroach)]"}`}
          >
            {priceLabel}
          </p>
          {paymentsEnabled && <TaxDisclaimer className="mt-2" />}
          <button
            type="button"
            disabled={loading}
            onClick={onBuy}
            className={`mt-4 w-full rounded-lg px-4 py-3 font-bold uppercase tracking-wide transition disabled:opacity-50 ${
              isKamal
                ? "war-btn-kamal"
                : "bg-[var(--cockroach)] text-black hover:brightness-110"
            }`}
          >
            {loading
              ? "Processing…"
              : paymentsEnabled
                ? `Pay ${priceLabel}`
                : `Buy (demo) ${priceLabel}`}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={onClear}
        className="mt-3 w-full rounded-lg border border-white/10 px-4 py-2 text-sm text-[var(--muted)] hover:border-white/25 hover:text-white"
      >
        Clear selection
      </button>
    </div>
  );
}
