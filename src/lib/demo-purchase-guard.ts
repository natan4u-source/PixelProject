import { NextResponse } from "next/server";
import { isProduction, isRazorpayEnabled } from "@/lib/env";

export function blockDemoPurchaseWhenPaymentsEnabled() {
  if (isProduction() && !isRazorpayEnabled()) {
    return NextResponse.json(
      { error: "Payments are not configured." },
      { status: 503 },
    );
  }

  if (!isRazorpayEnabled()) return null;

  return NextResponse.json(
    { error: "Demo checkout is disabled. Please pay with Razorpay." },
    { status: 403 },
  );
}
