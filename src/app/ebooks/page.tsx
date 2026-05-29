import { LegalBusinessDetails } from "@/components/legal/LegalBusinessDetails";
import { SiteFooter } from "@/components/SiteFooter";
import { EBOOK_PRICE_INR, EBOOKS } from "@/lib/business";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ebooks — KAMAL vs COCKROACH",
  description:
    "Digital PDF ebooks: customer support prompts, pixel war playbook, Instagram growth, India payments starter, and copy toolkit. ₹2999 each.",
};

export default function EbooksShopPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="hero-arena-glow pointer-events-none fixed inset-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-3xl px-4 pb-8 pt-8 sm:px-6 sm:pt-12">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--kamal-bright)]">
          Digital ebooks
        </p>
        <h1 className="war-title mt-4 text-center text-3xl text-white sm:text-4xl">Ebook shop</h1>
        <p className="mx-auto mt-4 max-w-lg text-center text-sm text-white/70">
          PDF guides · ~10 pages each · Pay online · Instant download · ₹
          {EBOOK_PRICE_INR.toLocaleString("en-IN")} per ebook
        </p>

        <ul className="mt-10 space-y-4">
          {EBOOKS.map((ebook) => (
            <li
              key={ebook.id}
              className="rounded-2xl border border-white/10 bg-[var(--surface-elevated)]/90 p-6"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                PDF · {ebook.pages} pages
              </p>
              <h2 className="mt-2 text-xl font-bold text-white">{ebook.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{ebook.description}</p>
              <p className="mt-4 font-mono text-lg text-[var(--kamal-bright)]">
                ₹{ebook.priceInr.toLocaleString("en-IN")}
              </p>
              <Link
                href={`/ebooks/${ebook.slug}`}
                className="mt-4 inline-block rounded-xl border border-[var(--kamal)]/50 px-5 py-2.5 text-sm font-bold text-[var(--kamal-bright)] transition hover:bg-[var(--kamal)]/10"
              >
                View &amp; buy →
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-center text-sm text-white/50">
          Also on{" "}
          <Link href="/products" className="text-[var(--kamal-bright)] underline">
            Products &amp; services
          </Link>
          .
        </p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-[var(--surface-elevated)]/80 p-5">
          <LegalBusinessDetails showOperatorLine={false} />
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
