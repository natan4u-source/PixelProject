"use client";

import { openCashfreeCheckout } from "@/lib/cashfree-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type EbookCheckoutProps = {
  productId: string;
  productName: string;
  priceInr: number;
};

export function EbookCheckout({ productId, productName, priceInr }: EbookCheckoutProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBuy = async () => {
    setBusy(true);
    setError(null);
    try {
      const orderRes = await fetch("/api/payments/create-ebook-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error ?? "Could not start payment.");
      }

      if (orderData.provider !== "cashfree") {
        throw new Error("Online payments are not configured yet.");
      }

      await openCashfreeCheckout(orderData.paymentSessionId, orderData.cashfreeMode);

      const verifyRes = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderData.orderId }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error ?? "Payment verification failed.");
      }

      if (verifyData.kind === "ebook" && verifyData.ebook?.downloadToken) {
        router.push(
          `/ebooks/thank-you?token=${encodeURIComponent(verifyData.ebook.downloadToken)}`,
        );
        return;
      }

      router.push(`/ebooks/thank-you?order_id=${encodeURIComponent(orderData.orderId)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleBuy}
        disabled={busy}
        className="w-full rounded-xl bg-[var(--kamal)] px-6 py-3 text-sm font-bold text-black transition hover:bg-[var(--kamal-bright)] disabled:opacity-60"
      >
        {busy ? "Processing…" : `Pay ₹${priceInr.toLocaleString("en-IN")} — download PDF`}
      </button>
      <p className="mt-3 text-xs text-white/40">
        Secure payment via Cashfree (UPI, cards, net banking). Instant PDF download after payment.
      </p>
      {error && (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      <p className="sr-only">Product: {productName}</p>
    </div>
  );
}
