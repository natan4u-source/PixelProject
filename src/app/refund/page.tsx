import { TAX_DISCLAIMER } from "@/components/TaxDisclaimer";
import { LegalBusinessDetails } from "@/components/legal/LegalBusinessDetails";
import { LegalList, LegalPageShell, LegalSection } from "@/components/legal/LegalPageShell";
import { SiteFooter } from "@/components/SiteFooter";
import {
  LEGAL_LAST_UPDATED,
  REFUND_MODE,
  REFUND_PROCESSING_BUSINESS_DAYS_MAX,
  REFUND_PROCESSING_BUSINESS_DAYS_MIN,
  REFUND_REQUEST_WINDOW_DAYS,
} from "@/lib/business";
import { SITE_NAME, SUPPORT_EMAIL } from "@/lib/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Return & Refund Policy — KAMAL vs COCKROACH",
  description: "Return and refund rules, duration, and refund mode for pixel purchases.",
};

export default function RefundPage() {
  return (
    <>
      <LegalPageShell
        badge="Legal"
        title="Return & Refund Policy"
        subtitle={`Return and refund rules for digital pixel purchases on ${SITE_NAME}.`}
        lastUpdated={LEGAL_LAST_UPDATED}
      >
        <LegalSection title="Operator">
          <LegalBusinessDetails />
        </LegalSection>

        <LegalSection title="Returns">
          <p>
            Pixels are a <strong className="text-white">digital, instantly delivered</strong> service shown
            on a public canvas. Physical returns do not apply. Once pixels are successfully allocated and
            revealed, they generally cannot be &ldquo;returned.&rdquo;
          </p>
        </LegalSection>

        <LegalSection title="Refund eligibility">
          <LegalList
            items={[
              "Duplicate charge for the same order.",
              "Payment succeeded but pixels were not allocated due to a technical error.",
              "Incorrect amount charged compared to the price shown at checkout.",
              "Other cases approved by us after review with Razorpay payment proof.",
            ]}
          />
          <p className="mt-3">
            Refunds are <strong className="text-white">not</strong> provided when pixels were correctly
            allocated and displayed, except where required by applicable law.
          </p>
        </LegalSection>

        <LegalSection title="Duration — when to contact us">
          <p>
            Report a qualifying issue within{" "}
            <strong className="text-white">{REFUND_REQUEST_WINDOW_DAYS} calendar days</strong> of the
            payment date. Include your Razorpay payment id or order id, purchase date, canvas (A or B), and
            a short description.
          </p>
        </LegalSection>

        <LegalSection title="Refund mode & processing time">
          <LegalList
            items={[
              `Refund mode: ${REFUND_MODE}`,
              `Processing time: ${REFUND_PROCESSING_BUSINESS_DAYS_MIN}–${REFUND_PROCESSING_BUSINESS_DAYS_MAX} business days after approval, plus any additional time required by your bank or payment network.`,
              "We will email you when a refund is initiated or if more information is needed.",
            ]}
          />
        </LegalSection>

        <LegalSection title="Taxes">
          <p>{TAX_DISCLAIMER}</p>
        </LegalSection>

        <LegalSection title="Cancellation">
          <p>
            See our separate{" "}
            <a href="/cancellation" className="text-[var(--kamal-bright)] underline">
              Cancellation Policy
            </a>{" "}
            for order cancellation before delivery.
          </p>
        </LegalSection>

        <LegalSection title="Contact">
          <p>
            Email{" "}
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
