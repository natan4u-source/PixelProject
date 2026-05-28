import { TAX_DISCLAIMER } from "@/components/TaxDisclaimer";
import { LegalBusinessDetails } from "@/components/legal/LegalBusinessDetails";
import { LegalPageShell, LegalSection } from "@/components/legal/LegalPageShell";
import { SiteFooter } from "@/components/SiteFooter";
import { LEGAL_LAST_UPDATED, PRODUCTS } from "@/lib/business";
import { PRICE_PER_PIXEL_INR, SITE_NAME, SITE_URL } from "@/lib/config";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products & Services — KAMAL vs COCKROACH",
  description:
    "Digital pixel products and prices in INR on kamalvscockroach.com. Team Kamal and Team Cockroach canvas pixels.",
};

export default function ProductsPage() {
  return (
    <>
      <LegalPageShell
        badge="Products"
        title="Products & Services"
        subtitle={`All digital products sold on ${SITE_NAME}. Prices in INR.`}
        lastUpdated={LEGAL_LAST_UPDATED}
      >
        <LegalSection title="Operator">
          <LegalBusinessDetails />
        </LegalSection>

        <LegalSection title="Product catalogue">
          <p className="mb-4 text-sm text-white/70">
            We sell <strong className="text-white">digital pixel placements only</strong> on a public
            1,000×1,000 canvas competition. No physical goods are shipped. Purchase on the{" "}
            <Link href="/" className="text-[var(--kamal-bright)] underline">
              home page
            </Link>
            .
          </p>
          <ul className="space-y-4">
            {PRODUCTS.map((product) => (
              <li
                key={product.id}
                className="rounded-xl border border-white/10 bg-black/30 p-5 text-sm leading-relaxed text-white/75"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                  {product.category}
                </p>
                <p className="mt-1 text-lg font-semibold text-white">{product.name}</p>
                <p className="mt-2">{product.description}</p>
                <p className="mt-3 font-mono text-[var(--kamal-bright)]">
                  ₹{product.priceInr.toLocaleString("en-IN")} {product.unit}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-white/50">
            Standard rate: ₹{PRICE_PER_PIXEL_INR.toLocaleString("en-IN")} per pixel unless a fixed
            pack price is shown above. Bulk quantity is selected at checkout (minimum 1 pixel).
          </p>
        </LegalSection>

        <LegalSection title="Payment & delivery">
          <p>
            Payment is collected online at checkout via <strong className="text-white">Cashfree</strong>{" "}
            (UPI, cards, net banking, and other methods enabled by Cashfree). Cash on delivery is not
            available.
          </p>
          <p className="mt-3">
            Delivery is instant: after successful payment verification, pixels are allocated and revealed
            on the live public canvas.
          </p>
        </LegalSection>

        <LegalSection title="Taxes">
          <p>{TAX_DISCLAIMER}</p>
        </LegalSection>

        <LegalSection title="How to buy">
          <p>
            Visit{" "}
            <a href={SITE_URL} className="text-[var(--kamal-bright)] underline">
              {SITE_URL}
            </a>
            , pick Team Kamal or Team Cockroach, select a pixel or bulk quantity, and complete payment.
          </p>
        </LegalSection>
      </LegalPageShell>
      <SiteFooter />
    </>
  );
}
