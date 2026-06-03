"use client";

import { SiteFooter } from "@/components/SiteFooter";
import { DEFAULT_RAZORPAY_PAYMENT_URL } from "@/lib/razorpay-config";
import { PRICE_PER_PIXEL_INR } from "@/lib/config";
import { SIDE_INFO, type CanvasSide } from "@/lib/sides";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type Step = "pay" | "claim" | "done";

function RazorpayPayContent() {
  const searchParams = useSearchParams();

  const side = (searchParams.get("side") === "b" ? "b" : "a") as CanvasSide;
  const type = searchParams.get("type") === "bulk" ? "bulk" : "single";
  const x = parseInt(searchParams.get("x") ?? "", 10);
  const y = parseInt(searchParams.get("y") ?? "", 10);
  const count = parseInt(searchParams.get("count") ?? "", 10);
  const initialStep = searchParams.get("step") === "claim" ? "claim" : "pay";

  const [step, setStep] = useState<Step>(initialStep);
  const [paymentRef, setPaymentRef] = useState("");
  const [teamSide, setTeamSide] = useState<CanvasSide>(side);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [razorpayUrl, setRazorpayUrl] = useState(DEFAULT_RAZORPAY_PAYMENT_URL);

  useEffect(() => {
    fetch(`/api/status?all=true&t=${Date.now()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.razorpayPaymentUrl) setRazorpayUrl(d.razorpayPaymentUrl);
      })
      .catch(() => {});
  }, []);

  const amountInr =
    type === "bulk" && count > 0 ? count * PRICE_PER_PIXEL_INR : PRICE_PER_PIXEL_INR;

  const orderValid =
    type === "single"
      ? Number.isFinite(x) && Number.isFinite(y)
      : Number.isFinite(count) && count > 0;

  const handleSubmitClaim = async () => {
    setBusy(true);
    setError(null);
    try {
      const payload =
        type === "single"
          ? {
              utr: paymentRef,
              side: teamSide,
              type: "single" as const,
              x,
              y,
              contactEmail: email || undefined,
            }
          : {
              utr: paymentRef,
              side: teamSide,
              type: "bulk" as const,
              count,
              contactEmail: email || undefined,
            };

      const res = await fetch("/api/upi/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save payment claim.");
      setSubmissionId(data.submission?.id ?? null);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed.");
    } finally {
      setBusy(false);
    }
  };

  if (!orderValid) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-red-400">Invalid order. Pick a pixel on the home page first.</p>
        <Link href="/" className="mt-4 inline-block text-[var(--kamal-bright)] underline">
          ← Back to battle
        </Link>
      </div>
    );
  }

  const sideInfo = SIDE_INFO[teamSide];

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="relative mx-auto max-w-lg px-4 pb-12 pt-8 sm:px-6">
        <Link href="/" className="text-sm text-[var(--kamal-bright)] underline">
          ← Back to canvas
        </Link>

        <h1 className="war-title mt-6 text-3xl text-white">Pay with Razorpay</h1>
        <p className="mt-2 text-sm text-white/65">
          {type === "single"
            ? `1 pixel at (${x}, ${y})`
            : `${count} bulk pixels`}{" "}
          ·{" "}
          <span
            className={
              sideInfo.color === "kamal" ? "text-[var(--kamal-bright)]" : "text-[var(--cockroach-bright)]"
            }
          >
            {sideInfo.label}
          </span>
        </p>
        <p className="mt-1 text-2xl font-bold text-[var(--accent)]">
          ₹{amountInr.toLocaleString("en-IN")}
        </p>

        {step === "pay" && (
          <div className="mt-8 space-y-6">
            <button
              type="button"
              onClick={() => setStep("claim")}
              className="w-full rounded-xl border border-white/20 py-3 text-sm font-semibold text-white hover:bg-white/5"
            >
              I&apos;ve paid — enter payment ID
            </button>

            <div className="rounded-2xl border border-[#528ff0]/40 bg-[#0c2451]/40 p-6 text-center">
              <p className="text-sm text-white/70">
                Pay exactly <strong className="text-white">{amountInr.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}</strong> on
                Razorpay, then come back and submit your payment ID from the receipt.
              </p>
              <button
                type="button"
                onClick={() => window.open(razorpayUrl, "_blank", "noopener,noreferrer")}
                className="mt-5 w-full rounded-xl bg-[#528ff0] py-4 text-base font-bold text-white hover:bg-[#3d7de8]"
              >
                Open Razorpay to pay
              </button>
            </div>
          </div>
        )}

        {step === "claim" && (
          <div className="mt-8 space-y-5 rounded-2xl border border-white/10 bg-[var(--surface-elevated)]/90 p-6">
            <p className="text-sm text-white/70">
              Enter the <strong className="text-white">Razorpay payment ID</strong> (starts with{" "}
              <code className="text-white/80">pay_</code>) or UTR from your receipt, and confirm your
              team.
            </p>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-white/50">
                Payment ID / UTR
              </span>
              <input
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="e.g. pay_xxxxxxxx or 12-digit UTR"
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 font-mono text-white"
                autoComplete="off"
              />
            </label>

            <fieldset>
              <legend className="text-xs font-bold uppercase tracking-wide text-white/50">
                Team to support
              </legend>
              <div className="mt-2 flex gap-3">
                {(["a", "b"] as CanvasSide[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setTeamSide(s)}
                    className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-bold transition ${
                      teamSide === s
                        ? s === "a"
                          ? "border-[var(--kamal)] bg-[var(--kamal)]/20 text-[var(--kamal-bright)]"
                          : "border-[var(--cockroach)] bg-[var(--cockroach)]/20 text-[var(--cockroach-bright)]"
                        : "border-white/15 text-white/50"
                    }`}
                  >
                    {SIDE_INFO[s].label}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-white/50">
                Email (optional)
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-white"
              />
            </label>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="button"
              disabled={busy || !paymentRef.trim()}
              onClick={handleSubmitClaim}
              className="w-full rounded-xl bg-[var(--kamal)] py-3 font-bold text-white disabled:opacity-50"
            >
              {busy ? "Submitting…" : "Submit claim"}
            </button>

            <button
              type="button"
              onClick={() => setStep("pay")}
              className="w-full text-center text-xs text-white/40 underline"
            >
              ← Back to payment
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="mt-8 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-6 text-center">
            <p className="text-lg font-bold text-emerald-300">Claim received</p>
            <p className="mt-2 text-sm text-white/70">
              We&apos;ll verify your Razorpay payment and reveal your pixel(s) shortly.
              {submissionId && (
                <span className="mt-2 block font-mono text-xs text-white/40">
                  Ref: {submissionId}
                </span>
              )}
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-xl bg-[var(--kamal)] px-6 py-3 text-sm font-bold text-white"
            >
              Back to battle
            </Link>
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}

export default function RazorpayPayPage() {
  return (
    <Suspense fallback={<p className="px-4 py-12 text-center text-white/50">Loading…</p>}>
      <RazorpayPayContent />
    </Suspense>
  );
}
