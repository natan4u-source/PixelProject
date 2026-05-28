import { LegalBusinessDetails } from "@/components/legal/LegalBusinessDetails";
import { PlatformNatureDisclaimer } from "@/components/PlatformNatureDisclaimer";
import { SITE_NAME } from "@/lib/config";
import Link from "next/link";

const LEGAL_LINKS = [
  { href: "/products", label: "Products" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/refund", label: "Return & Refund" },
  { href: "/contact", label: "Contact" },
] as const;

const SITE_LINKS = [
  { href: "/about", label: "About us" },
  { href: "/what-is-a-pixel", label: "What is a pixel?" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 px-4 py-8 text-center text-xs text-[var(--muted)]">
      <p className="font-semibold tracking-wide text-white/40">{SITE_NAME}</p>

      <div className="mx-auto mt-6 max-w-xl rounded-xl border border-white/8 bg-[var(--surface)]/40 p-4 text-left">
        <LegalBusinessDetails />
      </div>

      <PlatformNatureDisclaimer className="mx-auto mt-4 max-w-2xl text-center" />
      <nav
        className="mx-auto mt-5 flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-2"
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
