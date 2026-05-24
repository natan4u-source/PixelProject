import Link from "next/link";

type Props = {
  className?: string;
};

export function SiteLogo({ className = "" }: Props) {
  return (
    <Link
      href="/"
      className={`group flex items-center gap-2.5 sm:gap-3 ${className}`}
      aria-label="KAMAL vs COCKROACH — Home"
    >
      <div
        className="relative flex h-9 w-9 shrink-0 flex-col overflow-hidden rounded-md border border-white/15 shadow-[0_0_16px_rgba(255,154,26,0.2)] sm:h-10 sm:w-10"
        aria-hidden="true"
      >
        <div className="battle-bar-kamal flex h-1/2 items-center justify-center text-[10px]">
          🪷
        </div>
        <div className="battle-bar-cockroach flex h-1/2 items-center justify-center text-[10px]">
          🪳
        </div>
      </div>

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
