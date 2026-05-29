"use client";

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

export function UpiAppPicker({ payment, amountLabel, className = "" }: Props) {
  const onPick = (appId: UpiAppId) => {
    openUpiApp(appId, payment);
  };

  return (
    <div className={className}>
      <p className="text-center text-sm text-white/65">
        Pay <strong className="text-white">{amountLabel}</strong> — choose your app
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {UPI_APP_OPTIONS.map((app) => (
          <button
            key={app.id}
            type="button"
            onClick={() => onPick(app.id)}
            className={`flex flex-col items-center justify-center rounded-xl px-4 py-4 text-sm font-bold transition ${app.className}`}
          >
            <span className="text-lg leading-none">{app.shortLabel}</span>
            <span className="mt-1 text-[10px] font-normal opacity-90">{app.label}</span>
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
