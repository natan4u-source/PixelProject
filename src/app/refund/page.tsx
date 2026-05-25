import { TAX_DISCLAIMER } from "@/components/TaxDisclaimer";
import { LegalPageShell, LegalSection } from "@/components/legal/LegalPageShell";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE_NAME, SUPPORT_EMAIL } from "@/lib/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy — KAMAL vs COCKROACH",
  description: "Refund and cancellation rules for pixel purchases on kamalvscockroach.com.",
};

const LAST_UPDATED = "24 May 2026";

export default function RefundPage() {
  return (
    <>
      <LegalPageShell
        badge="Legal"
        title="Refund & Cancellation Policy"
        subtitle={`Refund rules for digital pixel purchases on ${SITE_NAME}.`}
        lastUpdated={LAST_UPDATED}
      >
        <LegalSection title="Taxes">
          <p>{TAX_DISCLAIMER}</p>
        </LegalSection>

        <LegalSection title="Refunds">
          <p>
            Due to the nature of digital purchases and immediate public allocation of pixels, purchases
            are generally non-refundable once successfully processed and displayed on the canvas.
          </p>
          <p>
            However, if a technical error causes duplicate charges or failed pixel allocation, users
            may contact support for review.
          </p>
        </LegalSection>

        <LegalSection title="Contact support">
          <p>
            Email{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[var(--kamal-bright)] underline">
              {SUPPORT_EMAIL}
            </a>{" "}
            with your Razorpay payment id or order id, the date of payment, and a short description of
            the issue. We aim to respond within 3–5 business days.
          </p>
        </LegalSection>
      </LegalPageShell>
      <SiteFooter />
    </>
  );
}
