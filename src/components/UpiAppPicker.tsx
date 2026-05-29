"use client";

import { UpiManualPayHelp } from "@/components/UpiManualPayHelp";
import {
  openUpiApp,
  UPI_APP_OPTIONS,
  type UpiAppId,
  type UpiPayInput,
} from "@/lib/upi-client";

type Props = {
  payment: UpiPayInput;
  amountLabel: string;
  className?: string;
};

const paytm = UPI_APP_OPTIONS.find((a) => a.id === "paytm")!;
const phonepe = UPI_APP_OPTIONS.find((a) => a.id === "phonepe")!;
const gpay = UPI_APP_OPTIONS.find((a) => a.id === "gpay")!;

export function UpiAppPicker({ payment, amountLabel, className = "" }: Props) {
  const onPick = (appId: UpiAppId) => {
    openUpiApp(appId, payment);
  };

  return (
    <div className={className}>
      <p className="text-center text-sm text-white/65">
        Pay <strong className="text-white">{amountLabel}</strong>
      </p>

      <div className="mt-4">
        <UpiManualPayHelp payment={payment} defaultOpen />
      </div>

      <p className="mt-5 text-center text-[10px] font-bold uppercase tracking-wider text-white/40">
        Or open your app
      </p>

      <button
        type="button"
        onClick={() => onPick("paytm")}
        className={`mt-2 flex w-full flex-col items-center justify-center rounded-xl px-4 py-4 text-sm font-bold transition ${paytm.className}`}
      >
        <span className="text-lg leading-none">{paytm.shortLabel}</span>
        <span className="mt-1 text-[10px] font-normal opacity-90">
          Recommended — usually opens without the gallery message
        </span>
      </button>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {[phonepe, gpay].map((app) => (
          <button
            key={app.id}
            type="button"
            onClick={() => onPick(app.id)}
            className={`flex flex-col items-center justify-center rounded-xl px-3 py-4 text-sm font-bold transition ${app.className}`}
          >
            <span className="text-lg leading-none">{app.shortLabel}</span>
            <span className="mt-1 text-center text-[9px] font-normal leading-tight opacity-90">
              If grey bar appears: DISMISS → Pay
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onPick("any")}
        className="mt-3 w-full rounded-lg border border-white/15 py-2 text-xs text-white/55 hover:bg-white/5 hover:text-white"
      >
        Other UPI app
      </button>
    </div>
  );
}
