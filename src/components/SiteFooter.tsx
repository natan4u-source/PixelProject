import { PlatformNatureDisclaimer } from "@/components/PlatformNatureDisclaimer";
import { SITE_NAME } from "@/lib/config";
import Link from "next/link";

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/refund", label: "Refund Policy" },
  { href: "/contact", label: "Contact" },
] as const;

const SITE_LINKS = [
  { href: "/about", label: "About" },
  { href: "/what-is-a-pixel", label: "What is a pixel?" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 py-8 text-center text-xs text-[var(--muted)]">
      <p className="font-semibold tracking-wide text-white/40">{SITE_NAME}</p>
      <PlatformNatureDisclaimer className="mx-auto mt-4 max-w-2xl px-4 text-center" />
      <nav
        className="mx-auto mt-4 flex max-w-xl flex-wrap items-center justify-center gap-x-4 gap-y-2"
        aria-label="Legal and site links"
      >
        {LEGAL_LINKS.map(({ href, label }) => (
          <Link key={href} href={href} className="underline hover:text-white">
            {label}
          </Link>
        ))}
        <span className="hidden text-white/20 sm:inline" aria-hidden="true">
          |
        </span>
        {SITE_LINKS.map(({ href, label }) => (
          <Link key={href} href={href} className="underline hover:text-white">
            {label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
