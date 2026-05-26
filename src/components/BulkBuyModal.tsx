"use client";

import { TaxDisclaimer } from "@/components/TaxDisclaimer";
import { useEffect, useMemo, useState } from "react";

type Props = {
  open: boolean;
  pricePerPixelInr: number;
  maxPixels: number;
  ready: boolean;
  loading: boolean;
  paymentsEnabled?: boolean;
  votingOpen?: boolean;
  onClose: () => void;
  onConfirm: (count: number) => void;
};

export function BulkBuyModal({
  open,
  pricePerPixelInr,
  maxPixels,
  ready,
  loading,
  paymentsEnabled = false,
  votingOpen = true,
  onClose,
  onConfirm,
}: Props) {
  const [quantity, setQuantity] = useState("1");

  useEffect(() => {
    if (open) setQuantity("1");
  }, [open]);

  const count = useMemo(() => {
    const n = parseInt(quantity, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [quantity]);

  const totalInr = count * pricePerPixelInr;
  const valid = count >= 1 && count <= maxPixels;

  if (!open) return null;

  const handleQuantityChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    setQuantity(digitsOnly === "" ? "" : digitsOnly.replace(/^0+(?=\d)/, ""));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-buy-title"
    >
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
        <h2 id="bulk-buy-title" className="text-xl font-bold">
          Buy pixels
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          ₹{pricePerPixelInr} per pixel · up to {maxPixels.toLocaleString("en-IN")} available on this side
        </p>

        {!ready && (
          <p className="mt-4 text-sm text-amber-300">
            Upload the hidden image on the admin page first.
          </p>
        )}

        {ready && (
          <>
            <label className="mt-5 block">
              <span className="text-sm text-[var(--muted)]">How many pixels?</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono text-lg outline-none focus:border-[var(--accent)]"
                placeholder="e.g. 10"
                autoFocus
              />
            </label>

            {quantity !== "" && !valid && (
              <p className="mt-2 text-sm text-red-400">
                Enter a number between 1 and {maxPixels.toLocaleString()}.
              </p>
            )}

            {valid && (
              <p className="mt-4 text-lg">
                Total:{" "}
                <span className="font-semibold text-[var(--accent)]">
                  ₹{totalInr.toLocaleString("en-IN")}
                </span>
              </p>
            )}

            {valid && paymentsEnabled && <TaxDisclaimer className="mt-2" />}

            {valid && (
              <p className="mt-2 text-xs text-[var(--muted)]">
                Pixels are chosen at random across the grid — they will not appear in one block.
              </p>
            )}
          </>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-[var(--border)] py-2.5 text-sm hover:border-[var(--muted)]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!votingOpen || !ready || !valid || loading}
            onClick={() => onConfirm(count)}
            className="flex-1 rounded-lg bg-[var(--accent)] py-2.5 text-sm font-semibold text-black disabled:opacity-50"
          >
            {loading
              ? "Processing…"
              : !votingOpen
                ? "Voting ended"
                : paymentsEnabled
                  ? `Pay ₹${valid ? totalInr.toLocaleString("en-IN") : "—"}`
                  : `Buy (demo) ₹${valid ? totalInr.toLocaleString("en-IN") : "—"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
