"use client";

import { openUpiPayment, type UpiPayInput } from "@/lib/upi-client";
import { useCallback, useEffect, useRef } from "react";

type Props = {
  open: boolean;
  payment: UpiPayInput;
  amountLabel: string;
  onPaid: () => void;
  onCancel: () => void;
};

export function UpiCheckoutOverlay({
  open,
  payment,
  amountLabel,
  onPaid,
  onCancel,
}: Props) {
  const openedRef = useRef(false);

  const launchUpi = useCallback(() => {
    openUpiPayment(payment);
  }, [payment]);

  useEffect(() => {
    if (!open) {
      openedRef.current = false;
      return;
    }
    if (openedRef.current) return;
    openedRef.current = true;
    launchUpi();
  }, [open, launchUpi]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upi-checkout-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[var(--surface-elevated)] p-6 shadow-2xl">
        <p
          id="upi-checkout-title"
          className="text-center text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--kamal-bright)]"
        >
          UPI payment
        </p>
        <h2 className="mt-3 text-center text-xl font-bold text-white">Complete in your UPI app</h2>
        <p className="mt-2 text-center text-sm text-white/65">
          Choose PhonePe, Google Pay, Paytm, or any UPI app. Amount{" "}
          <strong className="text-white">{amountLabel}</strong> is pre-filled.
        </p>

        <button
          type="button"
          onClick={launchUpi}
          className="mt-6 w-full rounded-xl bg-[var(--kamal)] py-3.5 text-sm font-bold text-black hover:bg-[var(--kamal-bright)]"
        >
          Open UPI app again
        </button>

        <button
          type="button"
          onClick={onPaid}
          className="mt-3 w-full rounded-xl border border-white/20 py-3 text-sm font-semibold text-white hover:bg-white/5"
        >
          I&apos;ve paid — enter UPI reference
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="mt-4 w-full text-center text-xs text-white/40 underline"
        >
          Cancel
        </button>

        <p className="mt-4 text-center text-[10px] text-white/35">
          App didn&apos;t open? Use Chrome/Safari (not Instagram browser), or scan QR on the next
          screen.
        </p>
      </div>
    </div>
  );
}
