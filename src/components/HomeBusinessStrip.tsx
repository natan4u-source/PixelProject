import { LegalBusinessDetails } from "@/components/legal/LegalBusinessDetails";
import { PRODUCTS } from "@/lib/business";
import { PRICE_PER_PIXEL_INR } from "@/lib/config";
import Link from "next/link";

export function HomeBusinessStrip() {
  return (
    <section
      id="business-info"
      className="border-t border-white/10 bg-[var(--bg-soft)]/90 px-4 py-10 sm:px-6 sm:py-12"
      aria-labelledby="business-info-heading"
    >
      <div className="mx-auto max-w-3xl">
        <h2
          id="business-info-heading"
          className="text-center text-xs font-bold uppercase tracking-[0.25em] text-white/55"
        >
          Business information
        </h2>

        <div className="mt-6 rounded-2xl border border-white/10 bg-[var(--surface-elevated)]/80 p-5 sm:p-6">
          <LegalBusinessDetails />
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-[var(--surface-elevated)]/80 p-5 sm:p-6">
          <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-[var(--accent)]">
            Products &amp; services (prices in INR)
          </h3>
          <ul className="mt-4 space-y-4">
            {PRODUCTS.map((product) => (
              <li
                key={product.id}
                className="rounded-xl border border-white/8 bg-black/25 p-4 text-sm leading-relaxed text-white/75"
              >
                <p className="font-semibold text-white">{product.name}</p>
                <p className="mt-1">{product.description}</p>
                <p className="mt-2 font-mono text-[var(--kamal-bright)]">
                  ₹{product.priceInr.toLocaleString("en-IN")} {product.unit}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-white/45">
            All prices are inclusive of applicable taxes as shown at checkout. Current standard rate: ₹
            {PRICE_PER_PIXEL_INR.toLocaleString("en-IN")} per pixel.
          </p>
          <p className="mt-2 text-center">
            <Link href="/products" className="text-xs text-[var(--kamal-bright)] underline hover:text-white">
              View full product catalogue ({PRODUCTS.length} products)
            </Link>
          </p>
        </div>

        <nav
          className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[11px] uppercase tracking-wide text-white/45"
          aria-label="Policies"
        >
          <Link href="/terms" className="underline hover:text-white">
            Terms
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/privacy" className="underline hover:text-white">
            Privacy
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/refund" className="underline hover:text-white">
            Refund
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/contact" className="underline hover:text-white">
            Contact
          </Link>
        </nav>
      </div>
    </section>
  );
}
