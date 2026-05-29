"use client";

import { SiteFooter } from "@/components/SiteFooter";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type EbookResult = {
  productName: string;
  downloadToken: string;
  downloadUrl: string;
};

function ThankYouContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const tokenParam = searchParams.get("token");

  const [loading, setLoading] = useState(Boolean(orderId && !tokenParam));
  const [error, setError] = useState<string | null>(null);
  const [ebook, setEbook] = useState<EbookResult | null>(
    tokenParam
      ? {
          productName: "Your ebook",
          downloadToken: tokenParam,
          downloadUrl: `/api/ebooks/download?token=${encodeURIComponent(tokenParam)}`,
        }
      : null,
  );

  useEffect(() => {
    if (!orderId || tokenParam) return;

    let cancelled = false;
    (async () => {
      try {
        const verifyRes = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: orderId }),
        });
        const data = await verifyRes.json();
        if (cancelled) return;
        if (!verifyRes.ok) {
          setError(data.error ?? "Could not verify payment.");
          return;
        }
        if (data.kind === "ebook" && data.ebook) {
          setEbook({
            productName: data.ebook.productName,
            downloadToken: data.ebook.downloadToken,
            downloadUrl:
              data.downloadUrl ??
              `/api/ebooks/download?token=${encodeURIComponent(data.ebook.downloadToken)}`,
          });
        } else {
          setError("This order is not an ebook purchase.");
        }
      } catch {
        if (!cancelled) setError("Verification failed. Refresh or contact support.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderId, tokenParam]);

  const downloadHref = ebook?.downloadUrl;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="relative mx-auto max-w-lg px-4 pb-8 pt-12 text-center sm:px-6">
        <h1 className="war-title text-3xl text-white">Thank you</h1>

        {loading && <p className="mt-6 text-white/70">Confirming your payment…</p>}

        {error && (
          <p className="mt-6 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && ebook && downloadHref && (
          <>
            <p className="mt-6 text-white/80">Payment successful.</p>
            <p className="mt-2 text-lg font-semibold text-[var(--kamal-bright)]">
              {ebook.productName}
            </p>
            <a
              href={downloadHref}
              className="mt-8 inline-block w-full max-w-sm rounded-xl bg-[var(--kamal)] px-6 py-4 text-sm font-bold text-black hover:bg-[var(--kamal-bright)]"
            >
              Download PDF
            </a>
            <p className="mt-4 text-xs text-white/45">
              Save this page or bookmark the download link. Valid 30 days.
            </p>
          </>
        )}

        <p className="mt-10">
          <Link href="/ebooks" className="text-[var(--kamal-bright)] underline">
            ← More ebooks
          </Link>
        </p>
      </div>
      <SiteFooter />
    </div>
  );
}

export default function EbookThankYouPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg)] px-4 pt-12 text-center text-white/70">
          Loading…
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}
