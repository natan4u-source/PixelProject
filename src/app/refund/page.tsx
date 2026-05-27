import { TAX_DISCLAIMER } from "@/components/TaxDisclaimer";
import { LegalBusinessDetails } from "@/components/legal/LegalBusinessDetails";
import { LegalList, LegalPageShell, LegalSection } from "@/components/legal/LegalPageShell";
import { SiteFooter } from "@/components/SiteFooter";
import { LEGAL_LAST_UPDATED } from "@/lib/business";
import { BUSINESS_NAME, PRICE_PER_PIXEL_INR, SITE_NAME, SUPPORT_EMAIL } from "@/lib/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Return & Refund Policy — KAMAL vs COCKROACH",
  description: "No refund policy for digital pixel purchases on kamalvscockroach.com.",
};

export default function RefundPage() {
  return (
    <>
      <LegalPageShell
        badge="Legal"
        title="Return & Refund Policy"
        subtitle={`Refund rules for digital pixel purchases on ${SITE_NAME}.`}
        lastUpdated={LEGAL_LAST_UPDATED}
      >
        <LegalSection title="Operator">
          <LegalBusinessDetails />
        </LegalSection>

        <LegalSection title="No refund policy">
          <p>
            <strong className="text-white">
              All sales are final. There is no refund on any pixel purchase.
            </strong>
          </p>
          <p className="mt-3">
            By completing payment, you agree that {BUSINESS_NAME} does not offer refunds, returns, or
            exchanges once a transaction is successfully processed — including when pixels are allocated
            and revealed on the public canvas.
          </p>
        </LegalSection>

        <LegalSection title="Why refunds are not offered">
          <LegalList
            items={[
              "Pixels are a digital service delivered instantly upon successful payment.",
              "Each purchase permanently marks coordinates on a public canvas visible to all visitors.",
              "The service cannot be reversed without affecting the collective canvas and other participants.",
            ]}
          />
        </LegalSection>

        <LegalSection title="Returns">
          <p>
            Physical returns do not apply. Digital pixel placements cannot be returned or undone after
            successful delivery.
          </p>
        </LegalSection>

        <LegalSection title="Before you pay">
          <p>
            Please review your selection, canvas (A or B), quantity, and price (₹
            {PRICE_PER_PIXEL_INR.toLocaleString("en-IN")} per pixel) before
            confirming payment on Cashfree. If you do not agree to this no-refund policy, do not complete
            the purchase.
          </p>
        </LegalSection>

        <LegalSection title="Taxes">
          <p>{TAX_DISCLAIMER}</p>
        </LegalSection>

        <LegalSection title="Cancellation">
          <p>
            See our{" "}
            <a href="/cancellation" className="text-[var(--kamal-bright)] underline">
              Cancellation Policy
            </a>{" "}
            for checkout cancellation before payment only.
          </p>
        </LegalSection>

        <LegalSection title="Contact">
          <p>
            For payment or technical questions (not refunds), email{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[var(--kamal-bright)] underline">
              {SUPPORT_EMAIL}
            </a>
            . We aim to respond within 3–5 business days.
          </p>
        </LegalSection>
      </LegalPageShell>
      <SiteFooter />
    </>
  );
}
