import { promises as fs } from "fs";
import { randomUUID } from "crypto";
import type { PurchaseResult } from "./purchase";
import { withFileLock } from "./file-lock";
import { DATA_DIR, PAYMENT_ORDERS_PATH } from "./paths";
import type { CanvasSide } from "./sides";

export type PaymentOrderStatus = "created" | "fulfilling" | "paid" | "failed";

export type PaymentOrderRecord = {
  id: string;
  side?: CanvasSide;
  razorpayOrderId: string;
  type: "single" | "bulk";
  x?: number;
  y?: number;
  count?: number;
  amountPaise: number;
  status: PaymentOrderStatus;
  createdAt: string;
  razorpayPaymentId?: string;
  purchaseId?: string;
  receipt?: PurchaseResult;
};

type PaymentOrderStore = Record<string, PaymentOrderRecord>;

export type PaymentClaimResult =
  | { kind: "paid"; receipt: PurchaseResult }
  | { kind: "claim"; order: PaymentOrderRecord }
  | { kind: "busy" }
  | { kind: "missing" };

async function readStore(): Promise<PaymentOrderStore> {
  try {
    const raw = await fs.readFile(PAYMENT_ORDERS_PATH, "utf8");
    return JSON.parse(raw) as PaymentOrderStore;
  } catch {
    return {};
  }
}

async function writeStore(store: PaymentOrderStore) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(PAYMENT_ORDERS_PATH, JSON.stringify(store, null, 2), "utf8");
}

function withPaymentStoreLock<T>(fn: () => Promise<T>) {
  return withFileLock("payment-orders", fn);
}

export async function savePaymentOrder(
  input: Omit<PaymentOrderRecord, "id" | "status" | "createdAt"> & {
    id?: string;
    status?: PaymentOrderStatus;
    createdAt?: string;
  },
): Promise<PaymentOrderRecord> {
  return withPaymentStoreLock(async () => {
    const store = await readStore();
    const record: PaymentOrderRecord = {
      id: input.id ?? randomUUID(),
      side: input.side,
      razorpayOrderId: input.razorpayOrderId,
      type: input.type,
      x: input.x,
      y: input.y,
      count: input.count,
      amountPaise: input.amountPaise,
      status: input.status ?? "created",
      createdAt: input.createdAt ?? new Date().toISOString(),
      razorpayPaymentId: input.razorpayPaymentId,
      purchaseId: input.purchaseId,
    };
    store[record.razorpayOrderId] = record;
    await writeStore(store);
    return record;
  });
}

export async function getPaymentOrderByRazorpayId(
  razorpayOrderId: string,
): Promise<PaymentOrderRecord | null> {
  const store = await readStore();
  return store[razorpayOrderId] ?? null;
}

export async function claimPaymentOrderForFulfillment(
  razorpayOrderId: string,
): Promise<PaymentClaimResult> {
  return withPaymentStoreLock(async () => {
    const store = await readStore();
    const existing = store[razorpayOrderId];
    if (!existing) return { kind: "missing" };

    if (existing.status === "paid" && existing.receipt) {
      return { kind: "paid", receipt: existing.receipt };
    }

    if (existing.status === "fulfilling") {
      return { kind: "busy" };
    }

    store[razorpayOrderId] = { ...existing, status: "fulfilling" };
    await writeStore(store);
    return { kind: "claim", order: store[razorpayOrderId]! };
  });
}

export async function completePaymentOrderFulfillment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  receipt: PurchaseResult,
): Promise<PaymentOrderRecord | null> {
  return withPaymentStoreLock(async () => {
    const store = await readStore();
    const existing = store[razorpayOrderId];
    if (!existing) return null;

    const updated: PaymentOrderRecord = {
      ...existing,
      status: "paid",
      razorpayPaymentId,
      purchaseId: receipt.id,
      receipt,
    };
    store[razorpayOrderId] = updated;
    await writeStore(store);
    return updated;
  });
}

export async function releasePaymentOrderClaim(razorpayOrderId: string) {
  return withPaymentStoreLock(async () => {
    const store = await readStore();
    const existing = store[razorpayOrderId];
    if (!existing || existing.status !== "fulfilling") return;

    store[razorpayOrderId] = { ...existing, status: "created" };
    await writeStore(store);
  });
}

/** @deprecated Use completePaymentOrderFulfillment */
export async function markPaymentOrderPaid(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  receipt: PurchaseResult,
): Promise<PaymentOrderRecord | null> {
  return completePaymentOrderFulfillment(razorpayOrderId, razorpayPaymentId, receipt);
}
