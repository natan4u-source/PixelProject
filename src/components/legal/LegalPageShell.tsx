import Link from "next/link";

type Props = {
  badge: string;
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  children: React.ReactNode;
};

export function LegalPageShell({ badge, title, subtitle, lastUpdated, children }: Props) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="hero-arena-glow pointer-events-none fixed inset-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
        <div className="guide-hero-panel rounded-2xl px-5 py-6 text-center sm:px-8 sm:py-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--kamal-bright)] sm:text-xs">
            {badge}
          </p>
          <h1 className="war-title mt-3 text-4xl text-white sm:text-5xl">{title}</h1>
          {subtitle && (
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/65 sm:text-base">
              {subtitle}
            </p>
          )}
          {lastUpdated && (
            <p className="mt-3 text-[10px] uppercase tracking-wider text-white/35">
              Last updated: {lastUpdated}
            </p>
          )}
        </div>

        <article className="mt-8 space-y-6 text-sm leading-relaxed text-white/75 sm:text-base">
          {children}
        </article>

        <p className="mt-10 text-center">
          <Link href="/" className="text-[var(--kamal-bright)] underline hover:text-white">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="guide-section-neutral rounded-2xl border bg-[var(--surface-elevated)]/90 p-5 sm:p-6">
      <h2 className="war-title text-xl text-white sm:text-2xl">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-[var(--accent)]">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
