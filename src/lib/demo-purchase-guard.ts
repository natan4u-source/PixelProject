import { NextResponse } from "next/server";
import { isRazorpayEnabled } from "@/lib/env";

export function blockDemoPurchaseWhenPaymentsEnabled() {
  if (!isRazorpayEnabled()) return null;
  return NextResponse.json(
    { error: "Demo checkout is disabled. Please pay with Razorpay." },
    { status: 403 },
  );
}
