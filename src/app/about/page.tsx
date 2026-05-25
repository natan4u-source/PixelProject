import { PermanenceDisclaimer } from "@/components/PermanenceDisclaimer";
import { SiteFooter } from "@/components/SiteFooter";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — KAMAL vs COCKROACH",
  description:
    "Kamal vs Cockroach is a live internet pixel war — satire, competition, and collective digital participation revealing hidden images one pixel at a time.",
};

const COMBINES = [
  "internet culture",
  "satire",
  "competition",
  "digital participation",
  "meme-era storytelling",
] as const;

const HOW_IT_WORKS = [
  "Choose a side",
  "Purchase pixel placements",
  "Watch the hidden image slowly reveal",
  "Help your side gain dominance in the live battle",
] as const;

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="hero-arena-glow pointer-events-none fixed inset-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
        <div className="guide-hero-panel rounded-2xl px-5 py-8 text-center sm:px-10 sm:py-12">
          <p className="inline-block rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--kamal-bright)] sm:text-xs">
            ⚔️ About the war
          </p>
          <h1 className="war-title mt-5 text-5xl text-white sm:text-6xl">Kamal vs Cockroach</h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            Kamal vs Cockroach is a live internet pixel war where people choose a side and
            collectively reveal hidden images one pixel at a time.
          </p>
          <div className="mx-auto mt-6 flex h-2.5 max-w-xs overflow-hidden rounded-full bg-black/50 sm:max-w-sm">
            <div className="battle-bar-kamal w-1/2" />
            <div className="battle-bar-cockroach w-1/2" />
          </div>
        </div>

        <article className="mt-8 space-y-5 sm:mt-10 sm:space-y-6">
          <AboutSection accent="neutral" badge="Origins" title="Inspired by internet culture">
            <p>
              Inspired by classic internet culture projects like collaborative pixel canvases and
              permanent online art experiments, the platform turns participation into a public,
              evolving battle. Every pixel purchased permanently contributes to the reveal progress
              of one side.
            </p>
          </AboutSection>

          <AboutSection accent="neutral" badge="The mix" title="What this project combines">
            <div className="flex flex-wrap gap-2">
              {COMBINES.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/80"
                >
                  {item}
                </span>
              ))}
            </div>
          </AboutSection>

          <AboutSection accent="neutral" badge="Live battle" title="Two sides compete in real time">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--kamal)]/40 bg-[var(--kamal)]/10 p-4 text-center">
                <p className="war-title war-title-kamal text-2xl">Team Kamal</p>
                <p className="mt-2 text-sm text-white/65">Side A · orange canvas · 🪷</p>
              </div>
              <div className="rounded-xl border border-[var(--cockroach)]/40 bg-[var(--cockroach)]/10 p-4 text-center">
                <p className="war-title war-title-cockroach text-2xl">Team Cockroach</p>
                <p className="mt-2 text-sm text-white/65">Side B · green canvas · 🪳</p>
              </div>
            </div>
            <p className="mt-4">
              As more pixels are revealed, hidden images slowly emerge and the live battle score
              changes publicly for everyone to see.
            </p>
          </AboutSection>

          <AboutSection accent="neutral" badge="Long-term" title="Built to stay online">
            <p>
              Unlike temporary social media trends, the canvas is designed to remain online
              long-term. Every purchased pixel becomes part of a permanent internet artifact and a
              snapshot of online participation during this moment in time.
            </p>
            <PermanenceDisclaimer className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3" />
          </AboutSection>

          <AboutSection accent="kamal" badge="Purpose" title="Why this exists">
            <p>
              The internet has always been driven by communities, memes, movements, and
              participation.
            </p>
            <p>
              Kamal vs Cockroach was created as a modern interactive internet experiment where:
            </p>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-[var(--kamal)]">→</span>
                <span>every contribution visibly changes the outcome</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[var(--kamal)]">→</span>
                <span>every participant becomes part of the story</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[var(--kamal)]">→</span>
                <span>the final reveal is shaped collectively by the public</span>
              </li>
            </ul>
            <p className="italic text-white/60">
              It is part internet artwork, part social experiment, and part live digital battle.
            </p>
          </AboutSection>

          <AboutSection accent="cockroach" badge="Play" title="How it works">
            <ol className="space-y-3">
              {HOW_IT_WORKS.map((step, i) => (
                <li key={step} className="flex gap-4">
                  <span className="guide-step-num shrink-0 text-2xl text-[var(--cockroach)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="pt-1">{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-lg font-bold text-[var(--accent)]">Every pixel matters.</p>
          </AboutSection>

          <div className="forever-pledge rounded-2xl px-6 py-8 text-center sm:px-10">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/50">
              Permanent participation
            </p>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white sm:text-base">
              This platform is designed so that purchased pixel placements remain part of the public
              canvas as it evolves over time.
            </p>
            <p className="war-title mt-6 text-3xl text-white sm:text-4xl">The battle may end.</p>
            <p className="war-title mt-1 text-3xl text-[var(--accent)] sm:text-4xl">
              The internet remembers.
            </p>
          </div>

          <AboutSection accent="neutral" badge="Disclaimer" title="Independent project">
            <p>
              Kamal vs Cockroach is independently operated as an internet entertainment and
              participation project involving satire, symbolism, artistic expression, and public
              interaction.
            </p>
            <p>
              The platform is not officially affiliated with or endorsed by any political party,
              government body, or public figure unless explicitly stated.
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
