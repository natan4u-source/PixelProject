import { EbookCheckout } from "@/components/EbookCheckout";
import { LegalBusinessDetails } from "@/components/legal/LegalBusinessDetails";
import { SiteFooter } from "@/components/SiteFooter";
import { EBOOKS } from "@/lib/business";
import { getEbookBySlug } from "@/lib/ebooks";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return EBOOKS.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ebook = getEbookBySlug(slug);
  if (!ebook) return { title: "Ebook not found" };
  return {
    title: `${ebook.name} — Ebook`,
    description: ebook.description.slice(0, 160),
  };
}

export default async function EbookProductPage({ params }: Props) {
  const { slug } = await params;
  const ebook = getEbookBySlug(slug);
  if (!ebook) notFound();

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="hero-arena-glow pointer-events-none fixed inset-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-2xl px-4 pb-8 pt-8 sm:px-6 sm:pt-12">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--kamal-bright)]">
          Digital ebook
        </p>
        <h1 className="war-title mt-4 text-center text-3xl text-white sm:text-4xl">{ebook.name}</h1>
        <p className="mx-auto mt-4 max-w-lg text-center text-sm leading-relaxed text-white/70">
          ~{ebook.pages} pages · PDF · Instant download after payment
        </p>

        <div className="guide-section-kamal mx-auto mt-8 max-w-md rounded-2xl border p-6 text-center">
          <p className="text-4xl font-bold text-[var(--accent)]">
            ₹{ebook.priceInr.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-sm text-white/50">One-time · PDF download</p>
          <div className="mt-6">
            <EbookCheckout
              productId={ebook.id}
              productName={ebook.name}
              priceInr={ebook.priceInr}
            />
          </div>
        </div>

        <section className="mt-10 rounded-2xl border border-white/10 bg-[var(--surface-elevated)]/90 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-white">About this ebook</h2>
          <p className="mt-4 text-sm leading-relaxed text-white/75">{ebook.description}</p>
        </section>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-6 text-sm text-white/60">
          <p>
            <strong className="text-white">Delivery:</strong> Download link appears immediately after
            successful Cashfree payment. Link valid 30 days — save your PDF.
          </p>
          <p className="mt-3">
            <Link href="/ebooks" className="text-[var(--kamal-bright)] underline">
              ← All ebooks
            </Link>
            {" · "}
            <Link href="/products" className="text-[var(--kamal-bright)] underline">
              Products catalogue
            </Link>
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-[var(--surface-elevated)]/80 p-5">
          <LegalBusinessDetails showOperatorLine={false} />
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
