import { NextResponse } from "next/server";

const CLIENT_SAFE = new Set([
  "Invalid pixel coordinates.",
  "This pixel is already sold.",
  "Payment verification failed.",
  "Payment order not found.",
  "Online payments are not configured yet.",
  "Cashfree is not configured.",
  "Payment not completed yet. Please wait and try again.",
  "Could not create Cashfree order.",
  "Invalid payment order.",
  "Payment is being processed. Try again in a few seconds.",
  "Payments are not configured.",
  "Demo checkout is disabled. Please pay online at checkout.",
  "Forbidden.",
]);

export function apiError(error: unknown, fallback = "Something went wrong.") {
  console.error(error);
  const raw = error instanceof Error ? error.message : fallback;
  const message = CLIENT_SAFE.has(raw) ? raw : fallback;
  const status =
    raw.includes("already sold") || raw.includes("being processed") ? 409 : 500;
  return NextResponse.json({ error: message }, { status });
}
