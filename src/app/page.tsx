"use client";

import { BattleAmbient } from "@/components/BattleAmbient";
import { BulkBuyModal } from "@/components/BulkBuyModal";
import { AnalyticsBeacon } from "@/components/AnalyticsBeacon";
import { PixelGrid } from "@/components/PixelGrid";
import { PurchasePanel } from "@/components/PurchasePanel";
import { PurchaseReceipt, type PurchaseReceiptData } from "@/components/PurchaseReceipt";
import { PermanenceDisclaimer } from "@/components/PermanenceDisclaimer";
import { PlatformNatureDisclaimer } from "@/components/PlatformNatureDisclaimer";
import { HomeBusinessStrip } from "@/components/HomeBusinessStrip";
import { SiteFooter } from "@/components/SiteFooter";
import { openCashfreeCheckout } from "@/lib/cashfree-client";
import { PRICE_PER_PIXEL_INR } from "@/lib/config";
import { SIDE_INFO, type CanvasSide } from "@/lib/sides";
import { getVotingClosedMessage, isVotingOpen } from "@/lib/voting";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type SideStatus = {
  side: CanvasSide;
  ready: boolean;
  grid: { width: number; height: number };
  sold: number;
  total: number;
  remaining: number;
  pricePerPixelInr: number;
  revealedReady?: boolean;
};

type SelectedPixel = {
  side: CanvasSide;
  x: number;
  y: number;
};

const FEATURES = [
  {
    title: "BUY PIXELS",
    body: "Choose any canvas. Buy pixels on your side.",
    icon: "🎯",
  },
  {
    title: "REVEAL TOGETHER",
    body: "Every pixel you buy reveals the hidden image.",
    icon: "✨",
  },
  {
    title: "SHIFT THE BATTLE",
    body: "Your pixels push your side ahead in the battle.",
    icon: "⚔️",
  },
  {
    title: "SEE THE VICTORY",
    body: "When your side wins, the full image is revealed!",
    icon: "🏆",
  },
] as const;

export default function HomePage() {
  const [sides, setSides] = useState<Record<CanvasSide, SideStatus> | null>(null);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [selected, setSelected] = useState<SelectedPixel | null>(null);
  const [selectedIsSold, setSelectedIsSold] = useState(false);
  const [revealedVersion, setRevealedVersion] = useState<Record<CanvasSide, number>>({ a: 0, b: 0 });
  const [loadingSide, setLoadingSide] = useState<CanvasSide | null>(null);
  const [bulkOpenForSide, setBulkOpenForSide] = useState<CanvasSide | null>(null);
  const [receipt, setReceipt] = useState<PurchaseReceiptData | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [votingOpen, setVotingOpen] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/status?all=true&t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load saved pixels");

      const data = await res.json();
      if (data.sides) setSides(data.sides);
      setPaymentsEnabled(Boolean(data.paymentsEnabled));
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
    const tick = () => setVotingOpen(isVotingOpen());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("order_id");
    if (!orderId) return;

    let cancelled = false;
    (async () => {
      try {
        const verifyRes = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: "cashfree", order_id: orderId }),
        });
        const verifyData = await verifyRes.json();
        if (cancelled) return;
        if (!verifyRes.ok) {
          setMessage(verifyData.error ?? "Payment verification failed.");
          return;
        }
        const receipt = verifyData.receipt as PurchaseReceiptData;
        const side = receipt.side ?? "a";
        setReceipt(receipt);
        bumpRevealed(side);
        await load();
        setMessage("Payment successful. Your pixels are on the canvas.");
      } catch {
        if (!cancelled) setMessage("Could not verify payment after redirect.");
      } finally {
        if (!cancelled) {
          params.delete("order_id");
          const qs = params.toString();
          const next = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
          window.history.replaceState({}, "", next);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [load]);

  useEffect(() => {
    if (!selected) {
      setSelectedIsSold(false);
      return;
    }

    let cancelled = false;
    fetch(
      `/api/pixels/check?side=${selected.side}&x=${selected.x}&y=${selected.y}&t=${Date.now()}`,
      { cache: "no-store" },
    )
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

  const selectedStatus = selected && sides ? sides[selected.side] : null;
  const pricePerPixel =
    selectedStatus?.pricePerPixelInr ?? sides?.a.pricePerPixelInr ?? PRICE_PER_PIXEL_INR;
  const priceLabel = `₹${pricePerPixel.toLocaleString("en-IN")}`;

  const kamalSold = sides?.a.sold ?? 0;
  const cockroachSold = sides?.b.sold ?? 0;
  const totalBattleSold = kamalSold + cockroachSold;
  const kamalShare = totalBattleSold > 0 ? (kamalSold / totalBattleSold) * 100 : 50;
  const cockroachShare = totalBattleSold > 0 ? (cockroachSold / totalBattleSold) * 100 : 50;

  const battleLeader: CanvasSide | "tie" | null =
    kamalSold > cockroachSold ? "a" : cockroachSold > kamalSold ? "b" : totalBattleSold > 0 ? "tie" : null;

  const bumpRevealed = (side: CanvasSide) => {
    setRevealedVersion((v) => ({ ...v, [side]: v[side] + 1 }));
  };

  const finishPurchase = async (
    side: CanvasSide,
    receiptData: PurchaseReceiptData,
    soldPixel?: { x: number; y: number },
  ) => {
    setReceipt(receiptData);
    if (soldPixel) {
      setSelectedIsSold(true);
      setSelected({ side, x: soldPixel.x, y: soldPixel.y });
    }
    bumpRevealed(side);
    await load();
  };

  const payOnline = async (
    side: CanvasSide,
    payload: { type: "single"; x: number; y: number } | { type: "bulk"; count: number },
  ) => {
    const orderRes = await fetch("/api/payments/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ side, ...payload }),
    });
    const orderData = await orderRes.json();
    if (!orderRes.ok) throw new Error(orderData.error ?? "Could not start payment.");

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
    if (!verifyRes.ok) throw new Error(verifyData.error ?? "Payment verification failed.");
    return verifyData.receipt as PurchaseReceiptData;
  };

  const handleBuy = async () => {
    if (!votingOpen) {
      setMessage(getVotingClosedMessage());
      return;
    }
    if (!selected || !selectedStatus?.ready) return;
    if (selectedStatus.remaining <= 0) {
      setMessage(`All pixels are sold out on ${SIDE_INFO[selected.side].label}.`);
      return;
    }

    const { side, x, y } = selected;
    setLoadingSide(side);
    setMessage(null);

    try {
      if (paymentsEnabled) {
        const receiptData = await payOnline(side, { type: "single", x, y });
        await finishPurchase(side, receiptData, { x, y });
      } else {
        const res = await fetch("/api/pixels/buy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ side, x, y }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Purchase failed.");
        await finishPurchase(side, data.receipt, { x, y });
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Purchase failed.");
    } finally {
      setLoadingSide(null);
    }
  };

  const handleBulkBuy = async (side: CanvasSide, count: number) => {
    if (!votingOpen) {
      setMessage(getVotingClosedMessage());
      setBulkOpenForSide(null);
      return;
    }
    const sideStatus = sides?.[side];
    if (!sideStatus?.ready) return;
    if (sideStatus.remaining <= 0) {
      setMessage(`All pixels are sold out on ${SIDE_INFO[side].label}.`);
      setBulkOpenForSide(null);
      return;
    }

    setLoadingSide(side);
    setMessage(null);

    try {
      if (paymentsEnabled) {
        const receiptData = await payOnline(side, { type: "bulk", count });
        setBulkOpenForSide(null);
        await finishPurchase(side, receiptData);
      } else {
        const res = await fetch("/api/pixels/buy-bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ side, count }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Purchase failed.");
        setBulkOpenForSide(null);
        await finishPurchase(side, data.receipt);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Purchase failed.");
    } finally {
      setLoadingSide(null);
    }
  };

  const renderHeroCanvas = (side: CanvasSide) => {
    const status = sides?.[side];
    const info = SIDE_INFO[side];
    const isKamal = side === "a";
    const revealedUrl =
      status && status.sold > 0 && status.revealedReady
        ? `/api/revealed?side=${side}&v=${revealedVersion[side]}&t=${Date.now()}`
        : null;
    const isSelectedSide = selected?.side === side;
    const gridSelected = isSelectedSide && selected ? { x: selected.x, y: selected.y } : null;

    const panelClass = isKamal
      ? isSelectedSide
        ? "war-panel-kamal war-panel-kamal-active"
        : "war-panel-kamal"
      : isSelectedSide
        ? "war-panel-cockroach war-panel-cockroach-active"
        : "war-panel-cockroach";

    const accentText = isKamal ? "text-[var(--kamal)]" : "text-[var(--cockroach)]";
    const hiddenColor = isKamal ? "#3d2e18" : "#183d22";
    const colClass = side === "a" ? "min-w-0 flex-1 lg:order-1" : "min-w-0 flex-1 lg:order-3";

    const sold = status?.sold ?? 0;
    const isWinning = battleLeader === side;

    return (
      <div key={side} className={`min-w-0 ${colClass}`}>
        <div
          className={`flex h-full flex-col rounded-2xl border bg-[var(--surface-elevated)]/90 p-3 backdrop-blur-sm sm:p-4 ${panelClass}`}
        >
          <div className={`mb-3 flex ${isKamal ? "justify-end" : "justify-start"}`}>
            <button
              type="button"
              onClick={() => setBulkOpenForSide(side)}
              disabled={
                !votingOpen ||
                !status?.ready ||
                loadingSide !== null ||
                (status?.remaining ?? 0) <= 0
              }
              className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition disabled:opacity-50 ${
                isKamal
                  ? "war-btn-kamal"
                  : "bg-[var(--cockroach)] text-black hover:brightness-110"
              }`}
            >
              {isKamal ? "Buy Kamal" : "Buy Cockroach"}
            </button>
          </div>

          <div className="mb-3 text-center">
            <p
              className={`inline-block rounded-sm px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] sm:text-xs ${
                isKamal ? "bg-[var(--kamal)] text-black" : "bg-[var(--cockroach)] text-black"
              }`}
            >
              {info.label}
            </p>
            <p className={`mt-1.5 text-[11px] font-semibold uppercase tracking-wider sm:text-xs ${accentText}`}>
              {info.tagline}
            </p>
          </div>

          <div
            className={`mb-3 rounded-xl border px-3 py-3 text-center ${
              isWinning
                ? isKamal
                  ? "border-[var(--kamal)]/50 bg-[var(--kamal)]/10"
                  : "border-[var(--cockroach)]/50 bg-[var(--cockroach)]/10"
                : "border-white/15 bg-white/5"
            }`}
          >
            {isWinning && (
              <p
                className={`mb-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  isKamal
                    ? "bg-[var(--kamal)]/30 text-[var(--kamal-bright)]"
                    : "bg-[var(--cockroach)]/30 text-[var(--cockroach-bright)]"
                }`}
              >
                👑 Currently winning
              </p>
            )}
            {battleLeader === "tie" && totalBattleSold > 0 && (
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/50">
                ⚖️ Tied
              </p>
            )}
            <p className={`war-title text-3xl sm:text-4xl ${isKamal ? "war-title-kamal" : "war-title-cockroach"}`}>
              {sold.toLocaleString("en-IN")}
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/45">pixels sold</p>
            {status && (
              <p className="mt-1.5 text-xs text-[var(--muted)]">
                {status.remaining.toLocaleString("en-IN")} left · ₹{status.pricePerPixelInr}/px
              </p>
            )}
          </div>

          {status && !status.ready && (
            <p className="mb-2 text-center text-xs text-amber-300">Upload image in admin</p>
          )}

          {status ? (
            <PixelGrid
              width={status.grid.width}
              height={status.grid.height}
              soldCount={status.sold}
              revealedUrl={revealedUrl}
              hiddenColor={hiddenColor}
              containerClassName="hero-canvas-grid relative w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-soft)]/80"
              selected={gridSelected}
              selectedIsSold={isSelectedSide ? selectedIsSold : false}
              onSelect={(x, y) => {
                setSelected({ side, x, y });
                setMessage(null);
              }}
            />
          ) : (
            <div className="hero-canvas-grid flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-soft)]/60 text-sm text-[var(--muted)]">
              Loading…
            </div>
          )}
        </div>
      </div>
    );
  };

  const heroCenter = (
    <div className="hero-center order-1 flex w-full shrink-0 flex-col items-center justify-center px-4 py-6 text-center lg:order-2 lg:w-[min(100%,360px)] lg:px-5 lg:py-8">
      <p className="live-badge rounded-full border border-[var(--kamal)]/40 bg-[var(--kamal)]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--kamal-bright)] sm:text-xs">
        🔥 Live Pixel War 🔥
      </p>
      <h1 className="war-title mt-4 flex flex-col items-center gap-1 sm:gap-2">
        <span className="war-title-kamal text-4xl sm:text-5xl xl:text-6xl">KAMAL</span>
        <span className="war-vs-pulse text-2xl font-bold text-white sm:text-3xl xl:text-4xl">VS</span>
        <span className="war-title-cockroach text-4xl sm:text-5xl xl:text-6xl">COCKROACH</span>
      </h1>
      <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/85">
        Choose a side. Buy pixels. Reveal the future.
      </p>

      <div className="forever-pledge mt-5 w-full max-w-xs rounded-xl px-4 py-3.5">
        <p className="text-sm font-bold leading-snug tracking-wide text-white sm:text-base">
          This page will never reset.
        </p>
        <p className="mt-1 text-sm font-bold leading-snug tracking-wide text-[var(--accent)] sm:text-base">
          Your support stays forever*
        </p>
      </div>
      <p className="mt-2 max-w-xs text-[10px] leading-relaxed text-white/40">
        *Every pixel you buy stays on the canvas permanently.
      </p>
      <PermanenceDisclaimer className="mx-auto mt-3 max-w-xs text-left" />
      <PlatformNatureDisclaimer className="mx-auto mt-3 max-w-xs text-left" />

      <p className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[10px] uppercase tracking-[0.15em] text-white/40">
        <span>🛡️ Secure</span>
        <span className="text-white/20">•</span>
        <span>Transparent</span>
        <span className="text-white/20">•</span>
        <span>Community powered</span>
      </p>
    </div>
  );

  const bulkSide = bulkOpenForSide;
  const bulkStatus = bulkSide && sides ? sides[bulkSide] : null;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <AnalyticsBeacon path="/" />

      {/* Hero arena */}
      <section id="canvases" className="relative overflow-hidden pt-3 sm:pt-4">
        <div className="hero-arena-glow pointer-events-none absolute inset-0" aria-hidden="true" />
        <BattleAmbient />

        <div className="relative z-[1] mx-auto max-w-[1800px] px-3 sm:px-4">
          {!votingOpen && (
            <div
              className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-center text-sm font-semibold text-red-200"
              role="alert"
            >
              {getVotingClosedMessage()}
            </div>
          )}

          {/* Competition is live — top strip */}
          <div
            id="battle"
            className="battle-live-strip relative z-[1] mb-4 rounded-2xl border border-white/15 bg-[var(--surface-elevated)]/95 p-4 backdrop-blur-md sm:p-5"
          >
            <h2 className="text-center text-xs font-bold uppercase tracking-[0.25em] text-white/80 sm:text-sm">
              The Competition is Live
            </h2>

            {battleLeader && battleLeader !== "tie" && (
              <p className="mt-2 text-center text-[11px] font-bold uppercase tracking-[0.15em] text-white/55 sm:text-xs">
                👑{" "}
                <span
                  className={
                    battleLeader === "a" ? "text-[var(--kamal-bright)]" : "text-[var(--cockroach-bright)]"
                  }
                >
                  {SIDE_INFO[battleLeader].teamName} is ahead
                </span>
              </p>
            )}

            {battleLeader === "tie" && totalBattleSold > 0 && (
              <p className="mt-2 text-center text-[11px] font-bold uppercase tracking-[0.15em] text-white/55 sm:text-xs">
                ⚖️ Dead heat — it&apos;s a tie
              </p>
            )}

            <div className="mt-3 flex items-center gap-3">
              <span className="hidden shrink-0 text-right font-mono text-xs text-[var(--kamal)] sm:block sm:w-20">
                {kamalSold.toLocaleString("en-IN")}
              </span>
              <div className="flex h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--bg-soft)] sm:h-3">
                <div
                  className="battle-bar-kamal transition-all duration-700"
                  style={{ width: `${kamalShare}%` }}
                />
                <div
                  className="battle-bar-cockroach transition-all duration-700"
                  style={{ width: `${cockroachShare}%` }}
                />
              </div>
              <span className="hidden shrink-0 font-mono text-xs text-[var(--cockroach)] sm:block sm:w-20">
                {cockroachSold.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {loadError && (
            <p className="mb-4 text-center text-sm text-red-400" role="alert">
              {loadError}
            </p>
          )}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-5">
            {heroCenter}
            <div className="order-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:contents">
              {renderHeroCanvas("a")}
              {renderHeroCanvas("b")}
            </div>
          </div>

          <div className="mx-auto mt-6 max-w-md">
            {selected && selectedStatus ? (
              <PurchasePanel
                side={selected.side}
                sideLabel={SIDE_INFO[selected.side].label}
                x={selected.x}
                y={selected.y}
                priceLabel={priceLabel}
                isSold={selectedIsSold}
                ready={selectedStatus.ready}
                loading={loadingSide === selected.side}
                paymentsEnabled={paymentsEnabled}
                votingOpen={votingOpen}
                onBuy={handleBuy}
                onClear={() => {
                  setSelected(null);
                  setMessage(null);
                }}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-[var(--surface)]/50 p-5 text-center text-sm text-[var(--muted)]">
                Click a pixel on either canvas to buy and shift the battle.{" "}
                <Link href="/what-is-a-pixel" className="text-[var(--kamal-bright)] underline hover:text-white">
                  New here? Learn what a pixel is
                </Link>
                .
              </div>
            )}
          </div>

          {message && (
            <p className="mt-4 text-center text-sm text-[var(--kamal-bright)]" role="status">
              {message}
            </p>
          )}
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="border-t border-white/10 bg-[var(--bg-soft)]/80 px-4 py-12 sm:px-6 sm:py-16"
      >
        <div className="mx-auto grid max-w-[1200px] gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="feature-card rounded-xl p-5 text-center">
              <p className="feature-icon-bounce text-3xl">{feature.icon}</p>
              <h3 className="mt-3 text-sm font-bold uppercase tracking-[0.15em]">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      <PurchaseReceipt receipt={receipt} onClose={() => setReceipt(null)} />

      {bulkSide && bulkStatus && (
        <BulkBuyModal
          open
          pricePerPixelInr={bulkStatus.pricePerPixelInr}
          maxPixels={bulkStatus.remaining}
          ready={bulkStatus.ready}
          loading={loadingSide === bulkSide}
          paymentsEnabled={paymentsEnabled}
          votingOpen={votingOpen}
          onClose={() => setBulkOpenForSide(null)}
          onConfirm={(count) => handleBulkBuy(bulkSide, count)}
        />
      )}

      <HomeBusinessStrip />

      <SiteFooter />
    </div>
  );
}
