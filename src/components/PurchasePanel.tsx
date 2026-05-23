"use client";

type Props = {
  x: number;
  y: number;
  priceLabel: string;
  isSold: boolean;
  ready: boolean;
  loading: boolean;
  onBuy: () => void;
  onClear: () => void;
};

export function PurchasePanel({
  x,
  y,
  priceLabel,
  isSold,
  ready,
  loading,
  onBuy,
  onClear,
}: Props) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <p className="text-sm text-[var(--muted)]">Selected pixel</p>
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
            Its true color is visible on the grid. Pick a dark (hidden) pixel to buy another.
          </p>
        </>
      )}

      {ready && !isSold && (
        <>
          <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
            Buy this pixel to permanently reveal that exact spot on the picture. One pixel, one
            piece of the image.
          </p>
          <p className="mt-3 text-lg font-semibold text-[var(--accent)]">{priceLabel}</p>
          <button
            type="button"
            disabled={loading}
            onClick={onBuy}
            className="mt-4 w-full rounded-lg bg-[var(--accent)] px-4 py-3 font-semibold text-black transition hover:bg-[var(--accent-dim)] disabled:opacity-50"
          >
            {loading ? "Processing…" : `Buy (demo) ${priceLabel}`}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={onClear}
        className="mt-3 w-full rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] hover:border-[var(--muted)]"
      >
        Clear selection
      </button>
    </div>
  );
}
