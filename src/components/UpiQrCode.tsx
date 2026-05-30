"use client";

import Image from "next/image";

type Props = {
  qrPath: string;
  title?: string;
  className?: string;
};

export function UpiQrCode({
  qrPath,
  title = "Scan with any UPI app",
  className = "",
}: Props) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-[var(--surface-elevated)]/90 p-6 text-center ${className}`}
    >
      <p className="mb-3 text-xs text-white/50">{title}</p>
      <Image
        src={qrPath}
        alt="UPI QR code"
        width={280}
        height={280}
        className="mx-auto rounded-xl"
        priority
      />
    </div>
  );
}
