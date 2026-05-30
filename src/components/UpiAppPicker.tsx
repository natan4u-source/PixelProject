"use client";

import { UpiQrCode } from "@/components/UpiQrCode";
import { openUpiApp, isMobileUserAgent, type UpiPayInput } from "@/lib/upi-client";
import { useEffect, useState } from "react";

type Props = {
  payment: UpiPayInput;
  amountLabel: string;
  qrPath?: string;
  className?: string;
};

const PAYTM_CLASS =
  "bg-[#00baf2] hover:bg-[#0099cc] text-black flex w-full flex-col items-center justify-center rounded-xl px-4 py-4 text-sm font-bold transition";

export function UpiAppPicker({
  payment,
  amountLabel,
  qrPath = "/upi-qr.png",
  className = "",
}: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileUserAgent());
  }, []);

  const copyVpa = async () => {
    try {
      await navigator.clipboard.writeText(payment.vpa);
    } catch {
      // ignore
    }
  };

  return (
    <div className={className}>
      <p className="text-center text-sm text-white/65">
        Pay <strong className="text-white">{amountLabel}</strong>
      </p>

      {isMobile ? (
        <>
          <button
            type="button"
            onClick={() => openUpiApp("paytm", payment)}
            className={`mt-4 ${PAYTM_CLASS}`}
          >
            <span className="text-lg leading-none">Paytm</span>
            <span className="mt-1 text-[10px] font-normal opacity-90">Open Paytm to pay</span>
          </button>

          <p className="mt-6 text-center text-[10px] font-bold uppercase tracking-wider text-white/40">
            Other UPI apps
          </p>
          <UpiQrCode
            qrPath={qrPath}
            title="Scan QR with PhonePe, GPay, BHIM, etc."
            className="mt-2"
          />
        </>
      ) : (
        <UpiQrCode qrPath={qrPath} title="Scan QR with your UPI app" className="mt-4" />
      )}

      <div className="mt-4 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-center">
        <p className="text-xs text-white/50">UPI ID</p>
        <p className="mt-1 font-mono text-sm text-white">{payment.vpa}</p>
        <button
          type="button"
          onClick={copyVpa}
          className="mt-2 text-xs text-[var(--kamal-bright)] underline"
        >
          Copy UPI ID
        </button>
      </div>
    </div>
  );
}
