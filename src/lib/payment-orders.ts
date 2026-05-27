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
  gatewayOrderId: string;
  type: "single" | "bulk";
  x?: number;
  y?: number;
  count?: number;
  amountPaise: number;
  status: PaymentOrderStatus;
  createdAt: string;
  gatewayPaymentId?: string;
  purchaseId?: string;
  receipt?: PurchaseResult;
};

type PaymentOrderStore = Record<string, PaymentOrderRecord>;

type StoredPaymentOrder = PaymentOrderRecord & {
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
};

export type PaymentClaimResult =
  | { kind: "paid"; receipt: PurchaseResult }
  | { kind: "claim"; order: PaymentOrderRecord }
  | { kind: "busy" }
  | { kind: "missing" };

function normalizeRecord(raw: StoredPaymentOrder): PaymentOrderRecord {
  const gatewayOrderId = raw.gatewayOrderId ?? raw.razorpayOrderId ?? "";
  return {
    id: raw.id,
    side: raw.side,
    gatewayOrderId,
    type: raw.type,
    x: raw.x,
    y: raw.y,
    count: raw.count,
    amountPaise: raw.amountPaise,
    status: raw.status,
    createdAt: raw.createdAt,
    gatewayPaymentId: raw.gatewayPaymentId ?? raw.razorpayPaymentId,
    purchaseId: raw.purchaseId,
    receipt: raw.receipt,
  };
}

async function readStore(): Promise<PaymentOrderStore> {
  try {
    const raw = await fs.readFile(PAYMENT_ORDERS_PATH, "utf8");
    const parsed = JSON.parse(raw) as Record<string, StoredPaymentOrder>;
    const store: PaymentOrderStore = {};
    for (const [key, value] of Object.entries(parsed)) {
      const record = normalizeRecord(value);
      store[record.gatewayOrderId || key] = record;
    }
    return store;
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
      gatewayOrderId: input.gatewayOrderId,
      type: input.type,
      x: input.x,
      y: input.y,
      count: input.count,
      amountPaise: input.amountPaise,
      status: input.status ?? "created",
      createdAt: input.createdAt ?? new Date().toISOString(),
      gatewayPaymentId: input.gatewayPaymentId,
      purchaseId: input.purchaseId,
    };
    store[record.gatewayOrderId] = record;
    await writeStore(store);
    return record;
  });
}

export async function getPaymentOrderByGatewayId(
  gatewayOrderId: string,
): Promise<PaymentOrderRecord | null> {
  const store = await readStore();
  return store[gatewayOrderId] ?? null;
}

export async function claimPaymentOrderForFulfillment(
  gatewayOrderId: string,
): Promise<PaymentClaimResult> {
  return withPaymentStoreLock(async () => {
    const store = await readStore();
    const existing = store[gatewayOrderId];
    if (!existing) return { kind: "missing" };

    if (existing.status === "paid" && existing.receipt) {
      return { kind: "paid", receipt: existing.receipt };
    }

    if (existing.status === "fulfilling") {
      return { kind: "busy" };
    }

    store[gatewayOrderId] = { ...existing, status: "fulfilling" };
    await writeStore(store);
    return { kind: "claim", order: store[gatewayOrderId]! };
  });
}

export async function completePaymentOrderFulfillment(
  gatewayOrderId: string,
  gatewayPaymentId: string,
  receipt: PurchaseResult,
): Promise<PaymentOrderRecord | null> {
  return withPaymentStoreLock(async () => {
    const store = await readStore();
    const existing = store[gatewayOrderId];
    if (!existing) return null;

    const updated: PaymentOrderRecord = {
      ...existing,
      status: "paid",
      gatewayPaymentId,
      purchaseId: receipt.id,
      receipt,
    };
    store[gatewayOrderId] = updated;
    await writeStore(store);
    return updated;
  });
}

export async function releasePaymentOrderClaim(gatewayOrderId: string) {
  return withPaymentStoreLock(async () => {
    const store = await readStore();
    const existing = store[gatewayOrderId];
    if (!existing || existing.status !== "fulfilling") return;

    store[gatewayOrderId] = { ...existing, status: "created" };
    await writeStore(store);
  });
}
