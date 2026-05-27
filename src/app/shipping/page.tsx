import { LegalBusinessDetails } from "@/components/legal/LegalBusinessDetails";
import { LegalList, LegalPageShell, LegalSection } from "@/components/legal/LegalPageShell";
import { SiteFooter } from "@/components/SiteFooter";
import {
  DIGITAL_DELIVERY_TIME,
  LEGAL_LAST_UPDATED,
} from "@/lib/business";
import { BUSINESS_NAME, SITE_NAME, SUPPORT_EMAIL } from "@/lib/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping Policy — KAMAL vs COCKROACH",
  description: "Shipping and delivery policy for digital pixel purchases.",
};

export default function ShippingPage() {
  return (
    <>
      <LegalPageShell
        badge="Legal"
        title="Shipping Policy"
        subtitle={`Delivery terms for digital services on ${SITE_NAME}.`}
        lastUpdated={LEGAL_LAST_UPDATED}
      >
        <LegalSection title="Operator">
          <LegalBusinessDetails />
        </LegalSection>

        <LegalSection title="Nature of service">
          <p>
            {BUSINESS_NAME} sells <strong className="text-white">digital pixel placements</strong> on a
            public online canvas. There are <strong className="text-white">no physical goods</strong> and
            no courier or postal shipping.
          </p>
        </LegalSection>

        <LegalSection title="Delivery duration">
          <LegalList
            items={[
              `Delivery time: ${DIGITAL_DELIVERY_TIME}.`,
              "After Cashfree confirms payment, pixels are allocated and revealed on the canvas automatically.",
              "You can verify your purchase on the live canvas and in your on-screen receipt.",
              "If you have a payment or delivery issue, contact us by email (see Contact page). Refunds are not offered.",
            ]}
          />
        </LegalSection>

        <LegalSection title="Service area">
          <p>
            The website is accessible worldwide, but purchases are intended for customers in India paying in
            INR through Cashfree.
          </p>
        </LegalSection>

        <LegalSection title="Contact">
          <p>
            Shipping or delivery issues:{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[var(--kamal-bright)] underline">
              {SUPPORT_EMAIL}
            </a>
          </p>
        </LegalSection>
      </LegalPageShell>
      <SiteFooter />
    </>
  );
}
