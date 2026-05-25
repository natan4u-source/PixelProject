import { LegalBusinessDetails } from "@/components/legal/LegalBusinessDetails";
import { LegalList, LegalPageShell, LegalSection } from "@/components/legal/LegalPageShell";
import { SiteFooter } from "@/components/SiteFooter";
import { LEGAL_LAST_UPDATED } from "@/lib/business";
import { SITE_NAME, SUPPORT_EMAIL } from "@/lib/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cash on Delivery (COD) — KAMAL vs COCKROACH",
  description: "COD availability for kamalvscockroach.com pixel purchases.",
};

export default function CodPage() {
  return (
    <>
      <LegalPageShell
        badge="Legal"
        title="Cash on Delivery (COD)"
        subtitle={`COD policy for ${SITE_NAME}.`}
        lastUpdated={LEGAL_LAST_UPDATED}
      >
        <LegalSection title="Operator">
          <LegalBusinessDetails />
        </LegalSection>

        <LegalSection title="COD availability">
          <p>
            <strong className="text-white">Cash on Delivery (COD) is not available.</strong>
          </p>
          <p className="mt-3">
            All pixel purchases are prepaid digital services. Payment must be completed online at checkout
            through Razorpay before pixels are allocated.
          </p>
        </LegalSection>

        <LegalSection title="Accepted payment methods">
          <LegalList
            items={[
              "UPI",
              "Credit and debit cards",
              "Net banking",
              "Other methods enabled by Razorpay at checkout",
            ]}
          />
        </LegalSection>

        <LegalSection title="Questions">
          <p>
            Payment help:{" "}
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
