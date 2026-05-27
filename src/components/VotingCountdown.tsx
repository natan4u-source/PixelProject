"use client";

import { VOTING_END_ISO, getVotingEndsAt } from "@/lib/voting";
import { useEffect, useState } from "react";

type Remaining = {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function calcRemaining(endMs: number, nowMs: number): Remaining {
  const totalMs = Math.max(0, endMs - nowMs);
  const totalSec = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { totalMs, days, hours, minutes, seconds };
}

type Props = {
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

export function VotingCountdown({ onOpenChange, className = "" }: Props) {
  const endMs = getVotingEndsAt().getTime();
  const endLabel = getVotingEndsAt().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });

  const [remaining, setRemaining] = useState<Remaining | null>(null);

  useEffect(() => {
    const tick = () => {
      const next = calcRemaining(endMs, Date.now());
      setRemaining(next);
      onOpenChange?.(next.totalMs > 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endMs, onOpenChange]);

  if (remaining === null) {
    return (
      <div
        className={`voting-countdown voting-countdown-loading ${className}`.trim()}
        aria-busy="true"
      />
    );
  }

  const closed = remaining.totalMs <= 0;

  return (
    <section
      className={`voting-countdown ${closed ? "voting-countdown-ended" : ""} ${className}`.trim()}
      aria-live="polite"
    >
      <div className="voting-countdown-inner">
        <p className="voting-countdown-label">
          {closed ? "Competition has ended" : "Competition ends in"}
        </p>

        {closed ? (
          <p className="voting-countdown-ended-msg">
            The pixel war is over — no more pixels can be bought. The canvas stays live forever.
          </p>
        ) : (
          <div className="voting-countdown-digits" role="timer">
            <TimeUnit value={remaining.days} label="Days" />
            <span className="voting-countdown-sep" aria-hidden="true">
              :
            </span>
            <TimeUnit value={remaining.hours} label="Hours" />
            <span className="voting-countdown-sep" aria-hidden="true">
              :
            </span>
            <TimeUnit value={remaining.minutes} label="Min" />
            <span className="voting-countdown-sep" aria-hidden="true">
              :
            </span>
            <TimeUnit value={remaining.seconds} label="Sec" emphasize />
          </div>
        )}

        <p className="voting-countdown-deadline">
          {closed ? `Closed ${endLabel} IST` : `Deadline: ${endLabel} IST`}
        </p>
      </div>
    </section>
  );
}

function TimeUnit({
  value,
  label,
  emphasize,
}: {
  value: number;
  label: string;
  emphasize?: boolean;
}) {
  return (
    <div className={`voting-countdown-unit ${emphasize ? "voting-countdown-unit-pulse" : ""}`}>
      <span className="voting-countdown-value">{String(value).padStart(2, "0")}</span>
      <span className="voting-countdown-unit-label">{label}</span>
    </div>
  );
}

export { VOTING_END_ISO };
