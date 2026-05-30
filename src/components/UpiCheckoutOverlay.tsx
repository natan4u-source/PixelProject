"use client";

import { UpiAppPicker } from "@/components/UpiAppPicker";
import { UpiPaymentHints } from "@/components/UpiPaymentHints";
import { isMobileUserAgent, type UpiPayInput } from "@/lib/upi-client";
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  payment: UpiPayInput;
  amountLabel: string;
  qrPath?: string;
  onPaid: () => void;
  onCancel: () => void;
};

export function UpiCheckoutOverlay({
  open,
  payment,
  amountLabel,
  qrPath = "/upi-qr.png",
  onPaid,
  onCancel,
}: Props) {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    setIsMobile(isMobileUserAgent());
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upi-checkout-title"
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/15 bg-[var(--surface-elevated)] p-6 shadow-2xl">
        <p
          id="upi-checkout-title"
          className="text-center text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--kamal-bright)]"
        >
          UPI payment
        </p>
        <h2 className="mt-3 text-center text-xl font-bold text-white">
          {isMobile ? "Pay with Paytm or QR" : "Scan QR to pay"}
        </h2>

        <button
          type="button"
          onClick={onPaid}
          className="mt-5 w-full rounded-xl border border-white/20 py-3 text-sm font-semibold text-white hover:bg-white/5"
        >
          I&apos;ve paid — enter UPI reference
        </button>

        <UpiAppPicker
          payment={payment}
          amountLabel={amountLabel}
          qrPath={qrPath}
          className="mt-5"
        />

        <UpiPaymentHints
          amountInr={payment.amountInr}
          isMobile={isMobile}
          className="mt-4"
        />

        <button
          type="button"
          onClick={onCancel}
          className="mt-4 w-full text-center text-xs text-white/40 underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
