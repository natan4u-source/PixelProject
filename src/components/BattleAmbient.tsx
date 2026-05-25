/** Decorative CSS-only motion for the hero — no image assets required */
export function BattleAmbient() {
  const floats = [
    { emoji: "✨", className: "battle-float battle-float-1 left-[8%] top-[12%] text-2xl opacity-70" },
    { emoji: "🖼️", className: "battle-float battle-float-2 right-[10%] top-[18%] text-2xl opacity-70" },
    { emoji: "📷", className: "battle-sparkle battle-sparkle-1 left-[22%] bottom-[20%] text-lg" },
    { emoji: "✨", className: "battle-sparkle battle-sparkle-2 right-[18%] bottom-[28%] text-xl" },
    { emoji: "🎨", className: "battle-float battle-float-3 left-[45%] top-[8%] text-lg opacity-50" },
    { emoji: "📜", className: "battle-sparkle battle-sparkle-3 right-[32%] top-[42%] text-lg" },
  ] as const;

  return (
    <div className="battle-ambient pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="battle-orb battle-orb-kamal" />
      <div className="battle-orb battle-orb-cockroach" />
      <div className="battle-shimmer" />
      {floats.map((item, i) => (
        <span key={i} className={`absolute select-none ${item.className}`}>
          {item.emoji}
        </span>
      ))}
    </div>
  );
}
