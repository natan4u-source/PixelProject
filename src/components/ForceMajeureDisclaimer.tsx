export const FORCE_MAJEURE_DISCLAIMER =
  "We are not responsible for delays, outages, or failure to perform caused by events beyond our reasonable control, including internet outages, cyberattacks, government actions, natural disasters, payment network failures, or hosting interruptions.";

type Props = {
  className?: string;
};

export function ForceMajeureDisclaimer({ className = "" }: Props) {
  return (
    <p className={`text-[10px] leading-relaxed text-white/45 sm:text-xs ${className}`}>
      {FORCE_MAJEURE_DISCLAIMER}
    </p>
  );
}
