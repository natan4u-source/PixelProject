export const PERMANENCE_DISCLAIMER =
  "While the platform is intended to remain publicly accessible long-term, we cannot guarantee permanent availability in all circumstances including technical failures, legal requirements, force majeure events, or circumstances beyond our reasonable control.";

type Props = {
  className?: string;
};

export function PermanenceDisclaimer({ className = "" }: Props) {
  return (
    <p className={`text-[10px] leading-relaxed text-white/40 sm:text-xs ${className}`}>
      {PERMANENCE_DISCLAIMER}
    </p>
  );
}
