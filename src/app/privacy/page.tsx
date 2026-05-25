import { PLATFORM_NATURE_DISCLAIMER } from "@/components/PlatformNatureDisclaimer";
import { LegalBusinessDetails } from "@/components/legal/LegalBusinessDetails";
import { LegalList, LegalPageShell, LegalSection } from "@/components/legal/LegalPageShell";
import { SiteFooter } from "@/components/SiteFooter";
import { LEGAL_LAST_UPDATED } from "@/lib/business";
import { BUSINESS_NAME, SITE_NAME } from "@/lib/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — KAMAL vs COCKROACH",
  description: "How we collect, use, and protect your information on kamalvscockroach.com.",
};

export default function PrivacyPage() {
  return (
    <>
      <LegalPageShell
        badge="Legal"
        title="Privacy Policy"
        subtitle={`How ${BUSINESS_NAME} handles your information when you use ${SITE_NAME}.`}
        lastUpdated={LEGAL_LAST_UPDATED}
      >
        <LegalSection title="Operator">
          <LegalBusinessDetails />
        </LegalSection>

        <LegalSection title="Platform purpose">
          <p>{PLATFORM_NATURE_DISCLAIMER}</p>
        </LegalSection>

        <LegalSection title="What we collect">
          <LegalList
            items={[
              "Payment information processed by Razorpay (we do not store your full card or UPI credentials on our servers).",
              "Pixel purchase records (coordinates, side, colour revealed, amount paid, date and time, and a purchase reference id).",
              "Basic technical data such as browser type, approximate region, referrer, and pages viewed (for analytics and security).",
              "Information you voluntarily send us by email.",
            ]}
          />
        </LegalSection>

        <LegalSection title="How we use information">
          <LegalList
            items={[
              "To complete pixel purchases and show your pixels on the public canvas.",
              "To prevent fraud, abuse, and duplicate charges.",
              "To improve the site and understand traffic patterns.",
              "To respond to support requests.",
              "To comply with law and payment-partner requirements.",
            ]}
          />
        </LegalSection>

        <LegalSection title="Public nature of the service">
          <p>
            When you buy a pixel, the position you purchased and its revealed colour appear on a{" "}
            <strong className="text-white">public</strong> canvas visible to all visitors. Do not use
            purchases to share private personal data.
          </p>
        </LegalSection>

        <LegalSection title="Sharing with third parties">
          <p>We may share limited data with:</p>
          <LegalList
            items={[
              "Razorpay — payment processing.",
              "Hosting providers (e.g. Render) — to run the website and store purchase data.",
              "Authorities — when required by applicable law.",
            ]}
          />
          <p>We do not sell your personal information.</p>
        </LegalSection>

        <LegalSection title="Data retention">
          <p>
            Purchase and canvas data are kept for as long as the service operates, because pixels are
            designed to remain on the canvas permanently. Analytics logs may be rotated or deleted
            periodically.
          </p>
        </LegalSection>

        <LegalSection title="Security">
          <p>
            We use HTTPS, server-side payment verification, and access controls on admin tools. No
            method of transmission over the internet is 100% secure; we work to protect data using
            reasonable industry practices.
          </p>
        </LegalSection>

        <LegalSection title="Your choices">
          <LegalList
            items={[
              "You may choose not to purchase pixels.",
              "For payment or purchase issues, email us at the contact address below.",
              "You may request information about purchases tied to your payment reference by contacting support with your Razorpay payment id or order id.",
            ]}
          />
        </LegalSection>

        <LegalSection title="Children">
          <p>
            This site is not directed at children under 18. We do not knowingly collect personal
            information from children.
          </p>
        </LegalSection>

        <LegalSection title="Changes">
          <p>
            We may update this policy from time to time. The &ldquo;Last updated&rdquo; date at the top
            will change when we do. Continued use of the site after changes means you accept the
            updated policy.
          </p>
        </LegalSection>

        <LegalSection title="Contact">
          <LegalBusinessDetails showOperatorLine={false} />
        </LegalSection>
      </LegalPageShell>
      <SiteFooter />
    </>
  );
}
