"use client";

import { SiteLogo } from "@/components/SiteLogo";
import { isAdminPanelPathname } from "@/lib/admin-path";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/what-is-a-pixel", label: "What is a pixel?" },
  { href: "/about", label: "About" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();

  if (isAdminPanelPathname(pathname)) {
    return null;
  }

  return (
    <header className="site-header sticky top-0 z-50">
      <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-4 px-3 py-3 sm:px-4 sm:py-3.5">
        <SiteLogo />

        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition sm:px-3.5 sm:py-2 sm:text-xs ${
                  active
                    ? "bg-white/10 text-white ring-1 ring-white/15"
                    : "text-white/55 hover:bg-white/5 hover:text-white"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}

          <Link
            href="/#canvases"
            className="war-btn-kamal ml-1 hidden rounded-lg px-3.5 py-2 text-[10px] font-bold uppercase tracking-wide sm:inline-block sm:text-xs"
          >
            Join battle
          </Link>
        </nav>
      </div>
    </header>
  );
}
