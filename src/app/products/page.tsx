import { LegalBusinessDetails } from "@/components/legal/LegalBusinessDetails";
import { LegalPageShell, LegalSection } from "@/components/legal/LegalPageShell";
import { SiteFooter } from "@/components/SiteFooter";
import { LEGAL_LAST_UPDATED, PRODUCTS } from "@/lib/business";
import { SITE_NAME } from "@/lib/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products & Services — KAMAL vs COCKROACH",
  description: "Pixel canvas products and prices in INR on kamalvscockroach.com.",
};

export default function ProductsPage() {
  return (
    <>
      <LegalPageShell
        badge="Products"
        title="Products & Services"
        subtitle={`Digital pixel purchases on ${SITE_NAME}. All prices in Indian Rupees (INR).`}
        lastUpdated={LEGAL_LAST_UPDATED}
      >
        <LegalSection title="Operator">
          <LegalBusinessDetails />
        </LegalSection>

        <LegalSection title="Catalogue">
          <div className="space-y-4">
            {PRODUCTS.map((product) => (
              <div
                key={product.id}
                className="rounded-xl border border-white/10 bg-black/25 p-4"
              >
                <h3 className="text-base font-bold text-white">{product.name}</h3>
                <p className="mt-2">{product.description}</p>
                <p className="mt-3 font-mono text-lg text-[var(--kamal-bright)]">
                  ₹{product.priceInr.toLocaleString("en-IN")} <span className="text-sm text-white/55">{product.unit}</span>
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-white/55">
            Payment is collected online at checkout via Razorpay (UPI, cards, net banking). No cash on
            delivery. See our{" "}
            <a href="/cod" className="text-[var(--kamal-bright)] underline">
              COD policy
            </a>
            .
          </p>
        </LegalSection>
      </LegalPageShell>
      <SiteFooter />
    </>
  );
}
