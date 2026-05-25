import { PERMANENCE_DISCLAIMER } from "@/components/PermanenceDisclaimer";
import { PLATFORM_NATURE_DISCLAIMER } from "@/components/PlatformNatureDisclaimer";
import { FORCE_MAJEURE_DISCLAIMER } from "@/components/ForceMajeureDisclaimer";
import { TAX_DISCLAIMER } from "@/components/TaxDisclaimer";
import { LegalList, LegalPageShell, LegalSection } from "@/components/legal/LegalPageShell";
import { SiteFooter } from "@/components/SiteFooter";
import {
  BUSINESS_NAME,
  PRICE_PER_PIXEL_INR,
  SITE_NAME,
  SITE_URL,
  SUPPORT_EMAIL,
} from "@/lib/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions — KAMAL vs COCKROACH",
  description: "Terms of use and purchase for kamalvscockroach.com pixel purchases.",
};

const LAST_UPDATED = "24 May 2026";

export default function TermsPage() {
  return (
    <>
      <LegalPageShell
        badge="Legal"
        title="Terms & Conditions"
        subtitle={`Rules for using ${SITE_NAME} and buying pixels.`}
        lastUpdated={LAST_UPDATED}
      >
        <LegalSection title="Agreement">
          <p>
            By accessing {SITE_URL} or buying pixels, you agree to these Terms & Conditions. If you do
            not agree, do not use the site or make a purchase. The operator is{" "}
            <strong className="text-white">{BUSINESS_NAME}</strong>.
          </p>
        </LegalSection>

        <LegalSection title="The service">
          <LegalList
            items={[
              `${SITE_NAME} is an interactive pixel canvas where visitors buy individual pixels on Team Kamal or Team Cockroach sides.`,
              "Each side has a hidden image that is revealed as pixels are sold.",
              "Pixel sales are counted publicly in a live battle score.",
              "The canvas is designed not to reset; purchased pixels remain visible as described on the site.",
            ]}
          />
        </LegalSection>

        <LegalSection title="Nature of the platform">
          <p>{PLATFORM_NATURE_DISCLAIMER}</p>
        </LegalSection>

        <LegalSection title="Long-term availability">
          <p>
            The canvas is intended to remain publicly accessible and not reset under normal operation.
            Purchased pixels are meant to stay on the canvas as described on the site.
          </p>
          <p>{PERMANENCE_DISCLAIMER}</p>
        </LegalSection>

        <LegalSection title="Pricing and payment">
          <LegalList
            items={[
              `The current price is ₹${PRICE_PER_PIXEL_INR.toLocaleString("en-IN")} per pixel unless we announce a change on the site.`,
              "Prices are shown before you confirm payment.",
              "Payments are processed by Razorpay. By paying, you also agree to Razorpay's terms where applicable.",
              "We may refuse or cancel transactions suspected of fraud or error.",
            ]}
          />
          <p className="mt-3">{TAX_DISCLAIMER}</p>
        </LegalSection>

        <LegalSection title="What you receive">
          <p>
            When payment succeeds, you receive the right to have the specific pixel coordinate(s) you
            purchased marked as sold and revealed on the public canvas for your chosen side. This is a
            digital, non-physical service. You do not receive ownership of the website, artwork, or
            underlying intellectual property beyond the display of your pixel(s) as part of the public
            canvas.
          </p>
        </LegalSection>

        <LegalSection title="No guarantees">
          <LegalList
            items={[
              "We do not guarantee uninterrupted access, error-free operation, or a particular battle outcome.",
              "We may perform maintenance, updates, or changes that briefly affect availability.",
              "Outages beyond our reasonable control are addressed under “Force majeure” below.",
              "Team branding and hidden images are artistic and expressive; see “Nature of the platform” above.",
            ]}
          />
        </LegalSection>

        <LegalSection title="Acceptable use">
          <p>You agree not to:</p>
          <LegalList
            items={[
              "Use bots or scripts to abuse purchases, APIs, or the canvas.",
              "Attempt to hack, scrape protected data, or access admin areas without permission.",
              "Use the site for unlawful, harassing, or misleading purposes.",
              "Buy pixels to display unlawful content in pixel messages (if such features exist).",
            ]}
          />
        </LegalSection>

        <LegalSection title="Intellectual property">
          <p>
            Site design, code, branding, and hidden master images belong to {BUSINESS_NAME} or its
            licensors. You may not copy, resell, or commercially exploit the site without written
            permission.
          </p>
        </LegalSection>

        <LegalSection title="Force majeure">
          <p>{FORCE_MAJEURE_DISCLAIMER}</p>
        </LegalSection>

        <LegalSection title="Limitation of liability">
          <p>
            To the fullest extent permitted by law, {BUSINESS_NAME} is not liable for indirect,
            incidental, or consequential damages arising from use of the site or pixel purchases. Our
            total liability for any claim relating to a purchase is limited to the amount you paid for
            that transaction.
          </p>
        </LegalSection>

        <LegalSection title="Governing law">
          <p>
            These terms are governed by the laws of India. Disputes shall be subject to the courts of
            India, unless mandatory consumer protection laws in your jurisdiction provide otherwise.
          </p>
        </LegalSection>

        <LegalSection title="Contact">
          <p>
            Questions about these terms:{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[var(--kamal-bright)] underline">
              {SUPPORT_EMAIL}
            </a>
            . See also our{" "}
            <a href="/privacy" className="text-[var(--kamal-bright)] underline">
              Privacy Policy
            </a>{" "}
            and{" "}
            <a href="/refund" className="text-[var(--kamal-bright)] underline">
              Refund Policy
            </a>
            .
          </p>
        </LegalSection>
      </LegalPageShell>
      <SiteFooter />
    </>
  );
}
