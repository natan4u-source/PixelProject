import { NextResponse } from "next/server";
import { isVotingOpen, votingClosedResponse } from "@/lib/voting";

export function blockWhenVotingClosed(): NextResponse | null {
  if (isVotingOpen()) return null;
  return NextResponse.json(votingClosedResponse(), { status: 403 });
}
