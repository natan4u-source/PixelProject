type Props = {
  amountInr: number;
  className?: string;
};

export function UpiPaymentHints({ amountInr, className = "" }: Props) {
  const amount = `₹${amountInr.toLocaleString("en-IN")}`;

  return (
    <p className={`text-center text-xs leading-relaxed text-white/50 ${className}`}>
      Fastest path: tap <strong className="text-white/70">Copy UPI ID + amount</strong> above, pay in
      the app, then submit UTR here. Paytm button works for {amount} for most users.
    </p>
  );
}
