export const TAX_DISCLAIMER =
  "Applicable taxes, including GST where required by law, may be added to purchases and displayed during checkout.";

type Props = {
  className?: string;
};

export function TaxDisclaimer({ className = "" }: Props) {
  return (
    <p className={`text-[10px] leading-relaxed text-white/45 sm:text-xs ${className}`}>
      {TAX_DISCLAIMER}
    </p>
  );
}
