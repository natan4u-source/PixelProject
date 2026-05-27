import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { ensureDualSideLayout } from "@/lib/layout-migrate";
import { getPaymentOrderByPurchaseId } from "@/lib/payment-orders";
import { readPurchases } from "@/lib/purchases";
import { sideFromSearchParams } from "@/lib/side-params";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  await ensureDualSideLayout();

  const url = new URL(request.url);
  let side;
  try {
    side = sideFromSearchParams(url.searchParams);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid side." },
      { status: 400 },
    );
  }

  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "20", 10) || 20, 1), 100);
  const offset = Math.max(parseInt(url.searchParams.get("offset") ?? "0", 10) || 0, 0);

  const { purchases, total } = await readPurchases(side, { limit, offset });

  const purchasesWithCashfree = await Promise.all(
    purchases.map(async (purchase) => {
      const order = await getPaymentOrderByPurchaseId(purchase.id);
      if (!order?.gatewayOrderId) return purchase;
      return {
        ...purchase,
        cashfreeOrderId: order.gatewayOrderId,
        cashfreePaymentId: order.gatewayPaymentId,
        amountPaise: order.amountPaise,
      };
    }),
  );

  return NextResponse.json({
    side,
    purchases: purchasesWithCashfree,
    total,
    limit,
    offset,
    hasMore: offset + purchases.length < total,
  });
}
