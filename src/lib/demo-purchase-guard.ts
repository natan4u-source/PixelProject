import { NextResponse } from "next/server";
import { isPaymentsEnabled, isProduction } from "@/lib/env";

export function blockDemoPurchaseWhenPaymentsEnabled() {
  if (isProduction() && !isPaymentsEnabled()) {
    return NextResponse.json(
      { error: "Payments are not configured." },
      { status: 503 },
    );
  }

  if (!isPaymentsEnabled()) return null;

  return NextResponse.json(
    { error: "Demo checkout is disabled. Please pay online at checkout." },
    { status: 403 },
  );
}
