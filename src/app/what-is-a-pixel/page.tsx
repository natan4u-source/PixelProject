import { SITE_NAME } from "@/lib/config";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "What is a Pixel? — KAMAL vs COCKROACH",
  description:
    "A simple explanation of what a pixel is and how buying pixels works on this site — written for everyone, no tech jargon.",
};

const STEPS = [
  { num: "01", text: "Pick a side — Team Kamal 🪷 or Team Cockroach 🪳." },
  { num: "02", text: "Click a square on that side's canvas (or buy many at once)." },
  { num: "03", text: "Pay ₹100 per pixel." },
  { num: "04", text: "That square lights up and reveals a piece of the hidden image." },
  { num: "05", text: "Your pixel count pushes your team ahead in the live battle." },
] as const;

const REASONS = [
  { icon: "🪷", text: "Support the side you believe in." },
  { icon: "📌", text: "Leave a permanent mark on a public canvas." },
  { icon: "✨", text: "Help reveal the full image, one square at a time." },
  { icon: "⚔️", text: "Push your team ahead in the KAMAL vs COCKROACH battle." },
] as const;

const FAQS = [
  {
    q: "Do I need to know coding?",
    a: "No. Just click a square and pay. That is it.",
  },
  {
    q: "Can I buy more than one?",
    a: "Yes. You can buy one pixel or many at the same time.",
  },
  {
    q: "Will my pixel disappear later?",
    a: "No. Once bought, your pixel stays on the canvas. Your support stays forever.",
  },
  {
    q: "What do I actually get?",
    a: "You get that exact square on the public canvas, and you help your team win the pixel count battle.",
  },
] as const;

export default function WhatIsAPixelPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="hero-arena-glow pointer-events-none fixed inset-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
        {/* Hero */}
        <div className="guide-hero-panel rounded-2xl px-5 py-8 text-center sm:px-10 sm:py-12">
          <p className="inline-block rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--kamal-bright)] sm:text-xs">
            📖 Simple guide
          </p>
          <h1 className="war-title mt-5 text-5xl text-white sm:text-6xl">What is a pixel?</h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
            No computer degree needed. Here is everything in plain words — what a pixel is, and
            what it means when you buy one on {SITE_NAME}.
          </p>

          <div className="mx-auto mt-6 flex h-2.5 max-w-xs overflow-hidden rounded-full bg-black/50 sm:max-w-sm">
            <div className="battle-bar-kamal w-1/2" />
            <div className="battle-bar-cockroach w-1/2" />
          </div>
        </div>

        <article className="mt-8 space-y-5 sm:mt-10 sm:space-y-6">
          <GuideSection
            accent="kamal"
            badge="Basics"
            title="Think of the smallest dot of colour"
          >
            <p>
              Look closely at your phone or TV screen. It is made of millions of tiny coloured dots.
              Each dot is called a <strong className="text-[var(--kamal-bright)]">pixel</strong>{" "}
              (short for &ldquo;picture element&rdquo;).
            </p>
            <p>
              One pixel is so small you usually cannot see it alone. But together, millions of
              pixels make every photo, video, and image you see.
            </p>
            <PixelDemo />
          </GuideSection>

          <GuideSection accent="cockroach" badge="Analogy" title="Like tiles in a mosaic">
            <p>
              Imagine a wall covered in small square tiles. Each tile is one colour. Step back, and
              the tiles form a full picture — maybe a lotus on one side, or something else on the
              other.
            </p>
            <p>
              That is exactly how pixels work.{" "}
              <strong className="text-[var(--cockroach-bright)]">One square = one pixel.</strong>{" "}
              Many squares = one complete image.
            </p>
          </GuideSection>

          <GuideSection accent="kamal" badge="This site" title="What a pixel means here">
            <p>
              On <strong className="text-white">{SITE_NAME}</strong>, each canvas is a huge grid of
              pixels — a digital mosaic with about{" "}
              <strong className="text-[var(--accent)]">one million</strong> tiny squares on each
              side (Team Kamal and Team Cockroach).
            </p>
            <p>
              When you <strong className="text-[var(--kamal-bright)]">buy a pixel</strong>, you are
              buying one of those tiny squares on your chosen side. That square is yours. It stays
              on the canvas forever — this page never resets.
            </p>
            <div className="forever-pledge mt-4 rounded-xl px-4 py-3 text-center">
              <p className="text-sm font-bold text-white">This page will never reset.</p>
              <p className="text-sm font-bold text-[var(--accent)]">Your support stays forever*</p>
            </div>
          </GuideSection>

          <GuideSection accent="cockroach" badge="How to buy" title="What happens when you buy one">
            <div className="space-y-3">
              {STEPS.map((step) => (
                <div
                  key={step.num}
                  className="flex gap-4 rounded-lg border border-white/8 bg-black/30 p-3 sm:p-4"
                >
                  <span className="guide-step-num shrink-0 text-3xl text-[var(--cockroach)] sm:text-4xl">
                    {step.num}
                  </span>
                  <p className="pt-1 text-sm leading-relaxed text-white/80 sm:text-base">{step.text}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-lg border border-dashed border-white/10 bg-black/20 p-4 text-center text-sm italic text-white/55">
              Before you buy, a pixel looks like a dark hidden square. After you buy, the colour
              shows — like scratching off one piece of a mystery picture.
            </p>
          </GuideSection>

          <GuideSection accent="neutral" badge="Why buy" title="Why people buy pixels">
            <div className="grid gap-3 sm:grid-cols-2">
              {REASONS.map((item) => (
                <div key={item.text} className="feature-card flex items-start gap-3 rounded-xl p-4">
                  <span className="text-2xl" aria-hidden="true">
                    {item.icon}
                  </span>
                  <p className="text-sm leading-relaxed text-white/75 sm:text-base">{item.text}</p>
                </div>
              ))}
            </div>
          </GuideSection>

          <GuideSection accent="neutral" badge="FAQ" title="Quick answers">
            <div className="grid gap-3 sm:grid-cols-2">
              {FAQS.map((faq) => (
                <div key={faq.q} className="feature-card rounded-xl p-4">
                  <p className="text-sm font-bold uppercase tracking-wide text-[var(--accent)]">
                    {faq.q}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">{faq.a}</p>
                </div>
              ))}
            </div>
          </GuideSection>
        </article>

        {/* CTA */}
        <div className="guide-hero-panel mt-10 rounded-2xl px-6 py-8 text-center sm:px-10">
          <p className="war-title text-3xl text-white sm:text-4xl">Ready to claim your square?</p>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/65 sm:text-base">
            Pick Team Kamal or Team Cockroach and buy your first pixel on the live canvas.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/#canvases"
              className="war-btn-kamal rounded-lg px-6 py-2.5 text-sm font-bold uppercase tracking-wide"
            >
              Go to the battle
            </Link>
            <Link
              href="/"
              className="war-btn-outline rounded-lg px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white/80 transition hover:text-white"
            >
              ← Back home
            </Link>
          </div>
        </div>

        <footer className="mt-12 border-t border-white/5 pt-8 text-center text-xs text-[var(--muted)]">
          <p className="font-semibold tracking-wide text-white/40">{SITE_NAME}</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link href="/" className="underline hover:text-white">
              Home
            </Link>
            <Link href="/#canvases" className="underline hover:text-white">
              Buy pixels
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

function GuideSection({
  accent,
  badge,
  title,
  children,
}: {
  accent: "kamal" | "cockroach" | "neutral";
  badge: string;
  title: string;
  children: React.ReactNode;
}) {
  const accentClass =
    accent === "kamal"
      ? "guide-section-kamal"
      : accent === "cockroach"
        ? "guide-section-cockroach"
        : "guide-section-neutral";

  const badgeClass =
    accent === "kamal"
      ? "bg-[var(--kamal)] text-black"
      : accent === "cockroach"
        ? "bg-[var(--cockroach)] text-black"
        : "border border-white/15 bg-white/5 text-white/70";

  return (
    <section
      className={`rounded-2xl border bg-[var(--surface-elevated)]/90 p-5 backdrop-blur-sm sm:p-6 ${accentClass}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`rounded-sm px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] ${badgeClass}`}
        >
          {badge}
        </span>
        <h2 className="war-title text-2xl text-white sm:text-3xl">{title}</h2>
      </div>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-white/70 sm:text-base">
        {children}
      </div>
    </section>
  );
}

function PixelDemo() {
  const revealed = [
    "#ff9a1a",
    "#ffb84d",
    "#39d353",
    "#5dff73",
    "#ff9a1a",
    "#39d353",
    "#f5c542",
    "#cc6a00",
  ];

  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
          Before — hidden pixel
        </p>
        <div className="mx-auto mt-3 grid w-fit grid-cols-4 gap-0.5" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="guide-pixel-hidden h-7 w-7 border border-black/40 sm:h-8 sm:w-8" />
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-white/40">Dark square — not bought yet</p>
      </div>

      <div className="rounded-xl border border-[var(--kamal)]/30 bg-black/40 p-4">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--kamal-bright)]">
          After — your pixel
        </p>
        <div className="mx-auto mt-3 grid w-fit grid-cols-4 gap-0.5" aria-hidden="true">
          {revealed.map((color, i) => (
            <div
              key={i}
              className="h-7 w-7 border border-black/30 sm:h-8 sm:w-8"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-[var(--cockroach-bright)]">
          Colour revealed — you bought it!
        </p>
      </div>
    </div>
  );
}
