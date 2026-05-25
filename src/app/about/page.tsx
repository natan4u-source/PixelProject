import { PermanenceDisclaimer } from "@/components/PermanenceDisclaimer";
import { PlatformNatureDisclaimer } from "@/components/PlatformNatureDisclaimer";
import { TaxDisclaimer } from "@/components/TaxDisclaimer";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE_NAME } from "@/lib/config";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — KAMAL vs COCKROACH",
  description:
    "Learn about the KAMAL vs COCKROACH live pixel war — two sides, two canvases, one public battle that never resets.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="hero-arena-glow pointer-events-none fixed inset-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
        <div className="guide-hero-panel rounded-2xl px-5 py-8 text-center sm:px-10 sm:py-12">
          <p className="inline-block rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--kamal-bright)] sm:text-xs">
            ⚔️ The mission
          </p>
          <h1 className="war-title mt-5 text-5xl text-white sm:text-6xl">About this battle</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
            {SITE_NAME} is a live, public pixel war. Two sides. Two hidden images. One scoreboard
            that runs forever.
          </p>
          <div className="mx-auto mt-6 flex h-2.5 max-w-xs overflow-hidden rounded-full bg-black/50 sm:max-w-sm">
            <div className="battle-bar-kamal w-1/2" />
            <div className="battle-bar-cockroach w-1/2" />
          </div>
          <PlatformNatureDisclaimer className="mx-auto mt-5 max-w-lg text-center" />
        </div>

        <article className="mt-8 space-y-5 sm:mt-10 sm:space-y-6">
          <AboutSection accent="kamal" badge="Team Kamal" title="Build the nation 🪷">
            <p>
              Team Kamal is Side A — the orange canvas. Supporters buy pixels to reveal a hidden
              lotus image, one square at a time. Every pixel you buy stays on the canvas permanently.
            </p>
          </AboutSection>

          <AboutSection accent="cockroach" badge="Team Cockroach" title="Spread the rot 🪳">
            <p>
              Team Cockroach is Side B — the green canvas. Supporters buy pixels to reveal their
              hidden image and push their side ahead in the live pixel count battle.
            </p>
          </AboutSection>

          <AboutSection accent="neutral" badge="The rules" title="How the war works">
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-[var(--accent)]">→</span>
                <span>Each side has its own canvas with about one million pixels.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[var(--accent)]">→</span>
                <span>
                  Pixels cost ₹100 each (plus applicable taxes at checkout). Buy one or buy in bulk.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-[var(--accent)]">→</span>
                <span>The side with more pixels sold is currently winning.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[var(--accent)]">→</span>
                <span>
                  This page never resets. Your support stays forever — every purchased pixel remains
                  on the public canvas.
                </span>
              </li>
            </ul>
            <TaxDisclaimer className="mt-3" />
            <PermanenceDisclaimer className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3" />
          </AboutSection>

          <AboutSection accent="neutral" badge="Why it exists" title="A canvas for the people">
            <p>
              This is not just a website — it is a living scoreboard. Anyone can visit, pick a side,
              and leave a permanent mark. No account needed. No coding needed. Just click, pay, and
              join the battle.
            </p>
            <p>
              Whether you support Team Kamal or Team Cockroach, your pixels are public, permanent,
              and counted in real time on the homepage.
            </p>
          </AboutSection>
        </article>

        <div className="guide-hero-panel mt-10 rounded-2xl px-6 py-8 text-center sm:px-10">
          <p className="war-title text-3xl text-white sm:text-4xl">Pick your side</p>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/65 sm:text-base">
            The battle is live right now. Every pixel counts.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/#canvases"
              className="war-btn-kamal rounded-lg px-6 py-2.5 text-sm font-bold uppercase tracking-wide"
            >
              Join the battle
            </Link>
            <Link
              href="/what-is-a-pixel"
              className="war-btn-outline rounded-lg px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white/80 transition hover:text-white"
            >
              What is a pixel?
            </Link>
          </div>
        </div>

        <div className="mt-12">
          <SiteFooter />
        </div>
      </div>
    </div>
  );
}

function AboutSection({
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
