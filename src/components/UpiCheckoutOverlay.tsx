"use client";

import { UpiAppPicker } from "@/components/UpiAppPicker";
import { UpiPaymentHints } from "@/components/UpiPaymentHints";
import type { UpiPayInput } from "@/lib/upi-client";

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
        <h2 className="mt-3 text-center text-xl font-bold text-white">Choose how to pay</h2>

        <UpiAppPicker payment={payment} amountLabel={amountLabel} className="mt-5" />

        <button
          type="button"
          onClick={onPaid}
          className="mt-6 w-full rounded-xl border border-white/20 py-3 text-sm font-semibold text-white hover:bg-white/5"
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

        <UpiPaymentHints
          amountInr={payment.amountInr}
          className="mt-4"
        />
      </div>
    </div>
  );
}
