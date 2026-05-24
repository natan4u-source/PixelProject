"use client";

import { BulkBuyModal } from "@/components/BulkBuyModal";
import { AnalyticsBeacon } from "@/components/AnalyticsBeacon";
import { MAX_BULK_PURCHASE } from "@/lib/config";
import { PixelGrid } from "@/components/PixelGrid";
import { PurchasePanel } from "@/components/PurchasePanel";
import { PurchaseReceipt, type PurchaseReceiptData } from "@/components/PurchaseReceipt";
import { openRazorpayCheckout } from "@/lib/razorpay-client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Status = {
  ready: boolean;
  grid: { width: number; height: number };
  sold: number;
  total: number;
  remaining: number;
  pricePerPixelInr: number;
  revealedReady?: boolean;
  paymentsEnabled?: boolean;
  razorpayKeyId?: string | null;
};

export default function HomePage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [selected, setSelected] = useState<{ x: number; y: number } | null>(null);
  const [selectedIsSold, setSelectedIsSold] = useState(false);
  const [revealedVersion, setRevealedVersion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [receipt, setReceipt] = useState<PurchaseReceiptData | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/status?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("Failed to load saved pixels");
      }
      setStatus(await res.json());
      setLoadError(null);
    } catch {
      setLoadError("Could not load saved sales. Check that npm run dev is running.");
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!selected) {
      setSelectedIsSold(false);
      return;
    }

    let cancelled = false;
    fetch(`/api/pixels/check?x=${selected.x}&y=${selected.y}&t=${Date.now()}`, {
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setSelectedIsSold(Boolean(data.sold));
      })
      .catch(() => {
        if (!cancelled) setSelectedIsSold(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selected]);

  const pricePerPixel = status?.pricePerPixelInr ?? 100;
  const priceLabel = `₹${pricePerPixel.toLocaleString("en-IN")}`;
  const paymentsEnabled = Boolean(status?.paymentsEnabled);

  const bumpRevealed = () => setRevealedVersion((v) => v + 1);

  const finishPurchase = async (receiptData: PurchaseReceiptData, soldPixel?: { x: number; y: number }) => {
    setReceipt(receiptData);
    if (soldPixel) {
      setSelectedIsSold(true);
      setSelected({ x: soldPixel.x, y: soldPixel.y });
    }
    bumpRevealed();
    await load();
  };

  const payWithRazorpay = async (
    payload: { type: "single"; x: number; y: number } | { type: "bulk"; count: number },
    description: string,
  ) => {
    const orderRes = await fetch("/api/payments/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const orderData = await orderRes.json();
    if (!orderRes.ok) {
      throw new Error(orderData.error ?? "Could not start payment.");
    }

    const payment = await openRazorpayCheckout({
      keyId: orderData.keyId,
      orderId: orderData.orderId,
      amount: orderData.amount,
      currency: orderData.currency,
      description,
    });

    const verifyRes = await fetch("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_payment_id: payment.razorpay_payment_id,
        razorpay_signature: payment.razorpay_signature,
      }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyRes.ok) {
      throw new Error(verifyData.error ?? "Payment verification failed.");
    }

    return verifyData.receipt as PurchaseReceiptData;
  };

  const handleBuy = async () => {
    if (!selected || !status?.ready) return;
    if (status.remaining <= 0) {
      setMessage("All pixels are sold out. Use the admin panel to clear sales and start again.");
      return;
    }
    setLoading(true);
    setMessage(null);

    try {
      if (paymentsEnabled) {
        const receiptData = await payWithRazorpay(
          { type: "single", x: selected.x, y: selected.y },
          `Pixel (${selected.x}, ${selected.y})`,
        );
        await finishPurchase(receiptData, selected);
      } else {
        const res = await fetch("/api/pixels/buy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ x: selected.x, y: selected.y }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Purchase failed.");
        }
        await finishPurchase(data.receipt, selected);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Purchase failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkBuy = async (count: number) => {
    if (!status?.ready) return;
    if (status.remaining <= 0) {
      setMessage("All pixels are sold out. Use the admin panel to clear sales and start again.");
      setBulkOpen(false);
      return;
    }
    setLoading(true);
    setMessage(null);

    try {
      if (paymentsEnabled) {
        const receiptData = await payWithRazorpay(
          { type: "bulk", count },
          `${count.toLocaleString("en-IN")} pixels`,
        );
        setBulkOpen(false);
        await finishPurchase(receiptData);
      } else {
        const res = await fetch("/api/pixels/buy-bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ count }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Purchase failed.");
        }
        setBulkOpen(false);
        await finishPurchase(data.receipt);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Purchase failed.");
    } finally {
      setLoading(false);
    }
  };

  const progress = status ? (status.sold / status.total) * 100 : 0;
  const revealedUrl =
    status && status.sold > 0 && status.revealedReady
      ? `/api/revealed?v=${revealedVersion}&t=${Date.now()}`
      : null;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 sm:px-6">
      <AnalyticsBeacon path="/" />
      <header className="mb-10 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--accent)]">Pixel Reveal</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          Buy one pixel. Uncover the picture.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[var(--muted)]">
          {paymentsEnabled
            ? "Pay securely with Razorpay. Each purchase permanently reveals pixels on the grid."
            : "Sales are saved on your server — refreshing the browser will not reset them."}
        </p>
      </header>

      {loadError && (
        <p className="mb-4 text-center text-sm text-red-400" role="alert">
          {loadError}
        </p>
      )}

      {status && status.remaining <= 0 && status.ready && (
        <p className="mb-4 text-center text-sm text-amber-300" role="status">
          Every pixel has been sold. Open the{" "}
          <Link href="/admin" className="underline">
            admin panel
          </Link>{" "}
          and use &quot;Reset grid&quot; to reset the grid.
        </p>
      )}

      {status && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Pixels sold" value={status.sold.toLocaleString()} />
          <Stat label="Still hidden" value={status.remaining.toLocaleString()} />
          <Stat label="Revealed" value={`${progress.toFixed(4)}%`} />
        </div>
      )}

      <div className="mb-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => setBulkOpen(true)}
          className="rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-black transition hover:bg-[var(--accent-dim)]"
        >
          Buy pixels
        </button>
        <p className="text-sm text-[var(--muted)]">
          ₹{pricePerPixel} per pixel
          {paymentsEnabled ? " · Razorpay checkout" : " · demo checkout"}
        </p>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-[var(--surface)]">
        <div
          className="h-full bg-[var(--accent)] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {status ? (
          <PixelGrid
            width={status.grid.width}
            height={status.grid.height}
            soldCount={status.sold}
            revealedUrl={revealedUrl}
            selected={selected}
            selectedIsSold={selectedIsSold}
            onSelect={(x, y) => {
              setSelected({ x, y });
              setMessage(null);
            }}
          />
        ) : (
          <div className="flex h-[min(70vh,720px)] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]">
            Loading grid…
          </div>
        )}

        {selected ? (
          <PurchasePanel
            x={selected.x}
            y={selected.y}
            priceLabel={priceLabel}
            isSold={selectedIsSold}
            ready={status?.ready ?? false}
            loading={loading}
            paymentsEnabled={paymentsEnabled}
            onBuy={handleBuy}
            onClear={() => {
              setSelected(null);
              setMessage(null);
            }}
          />
        ) : (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--muted)]">
            Click any pixel on the grid to select it.
          </div>
        )}
      </div>

      {message && (
        <p className="mt-4 text-center text-sm text-[var(--accent)]" role="status">
          {message}
        </p>
      )}

      <PurchaseReceipt receipt={receipt} onClose={() => setReceipt(null)} />

      <BulkBuyModal
        open={bulkOpen}
        pricePerPixelInr={pricePerPixel}
        maxPixels={Math.min(status?.remaining ?? 0, MAX_BULK_PURCHASE)}
        ready={status?.ready ?? false}
        loading={loading}
        paymentsEnabled={paymentsEnabled}
        onClose={() => setBulkOpen(false)}
        onConfirm={handleBulkBuy}
      />

      <footer className="mt-12 text-center text-xs text-[var(--muted)]">
        <Link href="/admin" className="underline hover:text-[var(--text)]">
          Admin panel
        </Link>
      </footer>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-center">
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
