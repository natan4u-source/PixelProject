type Props = {
  amountInr: number;
  className?: string;
};

export function UpiPaymentHints({ amountInr, className = "" }: Props) {
  const amount = `₹${amountInr.toLocaleString("en-IN")}`;

  return (
    <div className={`rounded-lg border border-amber-500/25 bg-amber-950/30 px-3 py-3 text-[10px] leading-relaxed text-amber-100/90 ${className}`}>
      <p className="font-semibold text-amber-200">Important</p>
      <p className="mt-1">
        Tap the <strong>coloured app button</strong> above — do <strong>not</strong> scan the QR from
        your photo gallery or screenshot.
      </p>
      <p className="mt-2">
        If PhonePe or GPay shows a grey “QR from gallery” bar, tap{" "}
        <strong>DISMISS</strong> then <strong>Pay</strong> ({amount} is allowed). Paytm users can pay
        normally.
      </p>
    </div>
  );
}
