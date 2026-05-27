/** ISO 8601 — override on Render with NEXT_PUBLIC_VOTING_END_ISO */
export const VOTING_END_ISO =
  process.env.NEXT_PUBLIC_VOTING_END_ISO?.trim() || "2026-06-05T23:59:59+05:30";

export function getVotingEndsAt(): Date {
  return new Date(VOTING_END_ISO);
}

export function isVotingOpen(now = Date.now()): boolean {
  return now < getVotingEndsAt().getTime();
}

export function getVotingClosedMessage(): string {
  const end = getVotingEndsAt().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
  return `The competition ended on ${end} (IST). No more pixels can be purchased.`;
}

export function votingClosedResponse() {
  return {
    error: getVotingClosedMessage(),
    votingOpen: false as const,
  };
}
