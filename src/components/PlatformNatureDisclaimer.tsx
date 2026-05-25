export const PLATFORM_NATURE_DISCLAIMER =
  "The platform is intended as an internet entertainment and participation project involving satire, symbolism, and public interaction. References to public themes, symbols, or factions are artistic and expressive in nature.";

type Props = {
  className?: string;
};

export function PlatformNatureDisclaimer({ className = "" }: Props) {
  return (
    <p className={`text-[10px] leading-relaxed text-white/40 sm:text-xs ${className}`}>
      {PLATFORM_NATURE_DISCLAIMER}
    </p>
  );
}
