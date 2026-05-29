"use client";

import { SiteFooter } from "@/components/SiteFooter";
import { PRICE_PER_PIXEL_INR } from "@/lib/config";
import { buildUpiPayUri } from "@/lib/upi-uri";
import { SIDE_INFO, type CanvasSide } from "@/lib/sides";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type Step = "pay" | "claim" | "done";

function UpiPayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const side = (searchParams.get("side") === "b" ? "b" : "a") as CanvasSide;
  const type = searchParams.get("type") === "bulk" ? "bulk" : "single";
  const x = parseInt(searchParams.get("x") ?? "", 10);
  const y = parseInt(searchParams.get("y") ?? "", 10);
  const count = parseInt(searchParams.get("count") ?? "", 10);

  const [step, setStep] = useState<Step>("pay");
  const [utr, setUtr] = useState("");
  const [teamSide, setTeamSide] = useState<CanvasSide>(side);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const [upiConfig, setUpiConfig] = useState<{
    vpa: string;
    payeeName: string;
    qrPath: string;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/status?all=true&t=${Date.now()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.upiVpa) {
          setUpiConfig({
            vpa: d.upiVpa,
            payeeName: d.upiPayeeName ?? "Merchant",
            qrPath: d.upiQrPath ?? "/upi-qr.png",
          });
        }
      })
      .catch(() => {});
  }, []);

  const amountInr =
    type === "bulk" && count > 0 ? count * PRICE_PER_PIXEL_INR : PRICE_PER_PIXEL_INR;

  const orderValid =
    type === "single"
      ? Number.isFinite(x) && Number.isFinite(y)
      : Number.isFinite(count) && count > 0;

  const upiLink =
    upiConfig &&
    buildUpiPayUri({
      vpa: upiConfig.vpa,
      payeeName: upiConfig.payeeName,
      amountInr,
      note: `Pixel ${SIDE_INFO[teamSide].shortLabel}`,
    });

  const copyVpa = async () => {
    if (!upiConfig) return;
    try {
      await navigator.clipboard.writeText(upiConfig.vpa);
    } catch {
      // ignore
    }
  };

  const handleSubmitClaim = async () => {
    setBusy(true);
    setError(null);
    try {
      const payload =
        type === "single"
          ? { utr, side: teamSide, type: "single" as const, x, y, contactEmail: email || undefined }
          : {
              utr,
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
      if (!res.ok) throw new Error(data.error ?? "Could not save your claim.");
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

        <h1 className="war-title mt-6 text-3xl text-white">Pay with UPI</h1>
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
            <div className="rounded-2xl border border-white/10 bg-[var(--surface-elevated)]/90 p-6 text-center">
              <Image
                src={upiConfig?.qrPath ?? "/upi-qr.png"}
                alt="UPI QR code"
                width={280}
                height={280}
                className="mx-auto rounded-xl"
                priority
              />
              <p className="mt-4 font-mono text-sm text-white">
                {upiConfig?.vpa ?? "7678571962@hdfc"}
              </p>
              <button
                type="button"
                onClick={copyVpa}
                className="mt-2 text-xs text-[var(--kamal-bright)] underline"
              >
                Copy UPI ID
              </button>
            </div>

            {upiLink && (
              <a
                href={upiLink}
                className="block w-full rounded-xl bg-[var(--kamal)] py-3.5 text-center text-sm font-bold text-black hover:bg-[var(--kamal-bright)]"
              >
                Open UPI app (amount pre-filled)
              </a>
            )}

            <p className="text-center text-xs text-white/45">
              On desktop, scan the QR with PhonePe, GPay, or Paytm. On Instagram/WhatsApp browser,
              open this page in Chrome or Safari if the UPI button does not work.
            </p>

            <button
              type="button"
              onClick={() => setStep("claim")}
              className="w-full rounded-xl border border-white/20 py-3 text-sm font-semibold text-white hover:bg-white/5"
            >
              I&apos;ve paid — enter UPI reference
            </button>
          </div>
        )}

        {step === "claim" && (
          <div className="mt-8 space-y-5 rounded-2xl border border-white/10 bg-[var(--surface-elevated)]/90 p-6">
            <p className="text-sm text-white/70">
              Enter the <strong className="text-white">12-digit UPI reference (UTR)</strong> from
              your payment receipt and confirm your team.
            </p>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-white/50">
                UPI reference (UTR)
              </span>
              <input
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                placeholder="e.g. 123456789012"
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 font-mono text-white"
                inputMode="numeric"
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
              <span className="text-xs text-white/50">Email (optional)</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
                placeholder="For problems with your order"
              />
            </label>

            <button
              type="button"
              disabled={busy || utr.trim().length < 10}
              onClick={handleSubmitClaim}
              className="w-full rounded-xl bg-[var(--kamal)] py-3 font-bold text-black disabled:opacity-50"
            >
              {busy ? "Saving…" : "Submit payment claim"}
            </button>

            <button
              type="button"
              onClick={() => setStep("pay")}
              className="w-full text-sm text-white/45 underline"
            >
              ← Back to QR
            </button>

            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}
          </div>
        )}

        {step === "done" && (
          <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-6 text-center">
            <p className="text-lg font-bold text-emerald-300">Claim received</p>
            <p className="mt-3 text-sm text-white/75">
              We&apos;ll verify your payment against our bank statement and reveal your pixel(s) on{" "}
              <strong className="text-white">{sideInfo.label}</strong>. This usually happens within
              24–48 hours after we upload the statement.
            </p>
            {submissionId && (
              <p className="mt-3 font-mono text-xs text-white/40">Ref: {submissionId.slice(0, 8)}…</p>
            )}
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-6 rounded-xl bg-white/10 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
            >
              Back to canvas
            </button>
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}

export default function UpiPayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg)] px-4 pt-12 text-center text-white/60">
          Loading payment…
        </div>
      }
    >
      <UpiPayContent />
    </Suspense>
  );
}
