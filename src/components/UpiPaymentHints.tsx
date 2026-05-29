type Props = {
  amountInr: number;
  className?: string;
};

export function UpiPaymentHints({ amountInr, className = "" }: Props) {
  const amount = `₹${amountInr.toLocaleString("en-IN")}`;

  return (
    <p className={`text-center text-[10px] leading-relaxed text-white/35 ${className}`}>
      Tap <strong className="text-white/50">PhonePe</strong>,{" "}
      <strong className="text-white/50">GPay</strong>, or{" "}
      <strong className="text-white/50">Paytm</strong> — not the QR from your photo gallery.
      If an app shows a grey “QR from gallery” bar, tap <strong className="text-white/50">DISMISS</strong>{" "}
      then <strong className="text-white/50">Pay</strong> ({amount} is allowed). Use Chrome or Safari,
      not Instagram&apos;s browser.
    </p>
  );
}
