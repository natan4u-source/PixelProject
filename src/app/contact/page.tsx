import { LegalBusinessDetails } from "@/components/legal/LegalBusinessDetails";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE_NAME, SITE_URL } from "@/lib/config";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — KAMAL vs COCKROACH",
  description: "Contact kamalvscockroach.com by email.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="hero-arena-glow pointer-events-none fixed inset-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-2xl px-4 pb-8 pt-6 sm:px-6 sm:pt-10">
        <div className="guide-hero-panel rounded-2xl px-5 py-8 text-center sm:px-10 sm:py-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--kamal-bright)] sm:text-xs">
            Get in touch
          </p>
          <h1 className="war-title mt-4 text-4xl text-white sm:text-5xl">Contact</h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/70 sm:text-base">
            Questions about pixel purchases, payments, or the site.
          </p>
        </div>

        <div className="mt-8 space-y-5">
          <section className="guide-section-kamal rounded-2xl border bg-[var(--surface-elevated)]/90 p-6 sm:p-8">
            <h2 className="war-title text-2xl text-white">Business details</h2>
            <div className="mt-4">
              <LegalBusinessDetails />
            </div>
            <p className="mt-4 text-xs text-white/45">
              Please include your Cashfree payment id or order id for purchase-related emails.
            </p>
          </section>

          <section className="guide-section-cockroach rounded-2xl border bg-[var(--surface-elevated)]/90 p-6 sm:p-8">
            <h2 className="war-title text-2xl text-white">Policies</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/70 marker:text-[var(--cockroach)] sm:text-base">
              <li>
                <Link href="/products" className="text-[var(--cockroach-bright)] underline">
                  Products &amp; services
                </Link>
              </li>
              <li>
                <Link href="/refund" className="text-[var(--cockroach-bright)] underline">
                  Return &amp; Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-[var(--cockroach-bright)] underline">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-[var(--cockroach-bright)] underline">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/30 p-5 text-center text-sm text-white/50">
            <p>Typical reply time: 3–5 business days.</p>
            <p className="mt-2">
              <a href={SITE_URL} className="text-[var(--accent)] underline hover:text-white">
                {SITE_URL}
              </a>
            </p>
            <p className="mt-1 text-white/40">{SITE_NAME}</p>
          </section>
        </div>

        <p className="mt-10 text-center">
          <Link href="/" className="text-[var(--kamal-bright)] underline hover:text-white">
            ← Back to home
          </Link>
        </p>
      </div>

      <SiteFooter />
    </div>
  );
}
