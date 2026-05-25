import { LegalBusinessDetails } from "@/components/legal/LegalBusinessDetails";
import { LegalList, LegalPageShell, LegalSection } from "@/components/legal/LegalPageShell";
import { SiteFooter } from "@/components/SiteFooter";
import { CANCELLATION_WINDOW_MINUTES, LEGAL_LAST_UPDATED } from "@/lib/business";
import { BUSINESS_NAME, SITE_NAME, SUPPORT_EMAIL } from "@/lib/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cancellation Policy — KAMAL vs COCKROACH",
  description: "Order cancellation rules for pixel purchases on kamalvscockroach.com.",
};

export default function CancellationPage() {
  return (
    <>
      <LegalPageShell
        badge="Legal"
        title="Cancellation Policy"
        subtitle={`How cancellations work for purchases on ${SITE_NAME}.`}
        lastUpdated={LEGAL_LAST_UPDATED}
      >
        <LegalSection title="Operator">
          <LegalBusinessDetails />
        </LegalSection>

        <LegalSection title="Before payment">
          <p>
            You may abandon checkout at any time before completing payment on Razorpay. No order is created
            and no charge is made.
          </p>
        </LegalSection>

        <LegalSection title="After payment — cancellation window">
          <LegalList
            items={[
              `If payment succeeds but pixels are not allocated due to a technical error, you may request cancellation within ${CANCELLATION_WINDOW_MINUTES} minutes of payment by emailing ${SUPPORT_EMAIL} with your Razorpay payment id.`,
              "Once pixels are successfully allocated and displayed on the public canvas, the order cannot be cancelled because the digital service is delivered immediately.",
              `${BUSINESS_NAME} may cancel or void a transaction suspected of fraud, duplicate charge, or system error before or after allocation.`,
            ]}
          />
        </LegalSection>

        <LegalSection title="How to request cancellation">
          <p>
            Email{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[var(--kamal-bright)] underline">
              {SUPPORT_EMAIL}
            </a>{" "}
            with your Razorpay payment id, order id, date/time of payment, and reason. We respond within 3–5
            business days.
          </p>
        </LegalSection>

        <LegalSection title="Related policies">
          <p>
            Pixel purchases are non-refundable. See our{" "}
            <a href="/refund" className="text-[var(--kamal-bright)] underline">
              Return &amp; Refund Policy
            </a>
            .
          </p>
        </LegalSection>
      </LegalPageShell>
      <SiteFooter />
    </>
  );
}
