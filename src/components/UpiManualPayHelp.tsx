"use client";

import {
  formatPaymentClipboard,
  getManualPaySteps,
  isMobileUserAgent,
  type UpiPayInput,
} from "@/lib/upi-client";
import { useEffect, useState } from "react";

type Props = {
  payment: UpiPayInput;
  /** When true, section starts expanded (recommended on mobile). */
  defaultOpen?: boolean;
};

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function UpiManualPayHelp({ payment, defaultOpen }: Props) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [copied, setCopied] = useState<string | null>(null);
  const steps = getManualPaySteps(payment);

  useEffect(() => {
    if (defaultOpen === undefined && isMobileUserAgent()) {
      setOpen(true);
    }
  }, [defaultOpen]);

  const onCopy = async (key: string, value: string) => {
    if (await copyText(value)) {
      setCopied(key);
      window.setTimeout(() => setCopied(null), 2000);
    }
  };

  const onCopyAll = async () => {
    if (await copyText(formatPaymentClipboard(payment))) {
      setCopied("all");
      window.setTimeout(() => setCopied(null), 2000);
    }
  };

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-950/25">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-amber-100"
      >
        <span>
          PhonePe / GPay stuck on “QR from gallery”?{" "}
          <span className="font-normal text-amber-100/70">Pay manually (recommended)</span>
        </span>
        <span className="shrink-0 text-amber-100/40">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-amber-500/20 px-4 py-4 text-sm text-white/80">
          <p>
            Open the app yourself → <strong>Send money</strong> → <strong>UPI ID</strong> (do not
            scan a QR from Photos). Paste the details below.
          </p>

          <button
            type="button"
            onClick={onCopyAll}
            className="w-full rounded-lg bg-[var(--kamal)] py-2.5 text-sm font-bold text-white hover:opacity-90"
          >
            {copied === "all" ? "Copied — paste in your UPI app" : "Copy UPI ID + amount + note"}
          </button>

          <ol className="list-decimal space-y-2 pl-5 text-white/75">
            <li>Open PhonePe or Google Pay</li>
            <li>
              UPI ID:{" "}
              <code className="rounded bg-white/10 px-1 font-mono text-xs">{steps.vpa}</code>
              <button
                type="button"
                onClick={() => onCopy("vpa", steps.vpa)}
                className="ml-2 text-xs text-[var(--kamal-bright)] underline"
              >
                {copied === "vpa" ? "Copied" : "Copy"}
              </button>
            </li>
            <li>
              Amount: <strong>₹{steps.amount}</strong>
              <button
                type="button"
                onClick={() => onCopy("amount", steps.amount)}
                className="ml-2 text-xs text-[var(--kamal-bright)] underline"
              >
                {copied === "amount" ? "Copied" : "Copy"}
              </button>
            </li>
            <li>
              Note: {steps.note}
              <button
                type="button"
                onClick={() => onCopy("note", steps.note)}
                className="ml-2 text-xs text-[var(--kamal-bright)] underline"
              >
                {copied === "note" ? "Copied" : "Copy"}
              </button>
            </li>
            <li>After paying, return here and submit your UPI reference (UTR)</li>
          </ol>

          <p className="text-xs text-white/45">
            If you used the coloured button and see a grey bar: tap <strong>DISMISS</strong>, then{" "}
            <strong>Pay</strong> — amount is under the ₹2,000 gallery limit.
          </p>
          <p className="text-xs text-white/45">
            Paytm: the blue button usually opens checkout without this issue.
          </p>
        </div>
      )}
    </div>
  );
}
