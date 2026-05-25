import Link from "next/link";

type Props = {
  className?: string;
};

export function SiteLogo({ className = "" }: Props) {
  return (
    <Link
      href="/"
      className={`group flex items-center ${className}`}
      aria-label="KAMAL vs COCKROACH — Home"
    >
      <div className="war-title flex flex-col leading-none sm:flex-row sm:items-baseline sm:gap-1.5">
        <span className="war-title-kamal text-lg sm:text-xl">KAMAL</span>
        <span className="hidden text-[10px] uppercase tracking-[0.35em] text-white/40 sm:inline">
          vs
        </span>
        <span className="war-title-cockroach text-lg sm:text-xl">COCKROACH</span>
      </div>
    </Link>
  );
}
