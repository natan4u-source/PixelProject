"use client";

import { BulkBuyModal } from "@/components/BulkBuyModal";
import { MAX_BULK_PURCHASE } from "@/lib/config";
import { PixelGrid } from "@/components/PixelGrid";
import { PurchasePanel } from "@/components/PurchasePanel";
import { PurchaseReceipt, type PurchaseReceiptData } from "@/components/PurchaseReceipt";
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

  const bumpRevealed = () => setRevealedVersion((v) => v + 1);

  const handleBuy = async () => {
    if (!selected || !status?.ready) return;
    if (status.remaining <= 0) {
      setMessage("All pixels are sold out. Use the admin panel to clear sales and start again.");
      return;
    }
    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/pixels/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ x: selected.x, y: selected.y }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(data.error ?? "Purchase failed.");
      return;
    }

    setReceipt(data.receipt);
    setSelectedIsSold(true);
    if (selected) {
      setSelected({ x: selected.x, y: selected.y });
    }
    bumpRevealed();
    await load();
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

    const res = await fetch("/api/pixels/buy-bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(data.error ?? "Purchase failed.");
      return;
    }

    setBulkOpen(false);
    setReceipt(data.receipt);
    bumpRevealed();
    await load();
  };

  const progress = status ? (status.sold / status.total) * 100 : 0;
  const revealedUrl =
    status && status.sold > 0 && status.revealedReady
      ? `/api/revealed?v=${revealedVersion}&t=${Date.now()}`
      : null;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-10 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--accent)]">Pixel Reveal</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          Buy one pixel. Uncover the picture.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[var(--muted)]">
          Sales are saved on your computer in the <code className="text-[var(--text)]">data</code>{" "}
          folder — refreshing the browser will not reset them.
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
        <p className="text-sm text-[var(--muted)]">₹{pricePerPixel} per pixel · demo checkout</p>
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
