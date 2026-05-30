type Props = {
  amountInr: number;
  className?: string;
  isMobile?: boolean;
};

export function UpiPaymentHints({ amountInr, className = "", isMobile }: Props) {
  const amount = `₹${amountInr.toLocaleString("en-IN")}`;

  if (isMobile === false) {
    return (
      <p className={`text-center text-xs leading-relaxed text-white/50 ${className}`}>
        Scan the QR code with any UPI app to pay {amount}, then submit your UPI reference below.
      </p>
    );
  }

  return (
    <p className={`text-center text-xs leading-relaxed text-white/50 ${className}`}>
      Pay {amount} with Paytm, or scan the QR for other UPI apps. Then enter your UPI reference (UTR).
    </p>
  );
}
