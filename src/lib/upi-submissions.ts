import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import { PRICE_PER_PIXEL_INR } from "./config";
import { withFileLock } from "./file-lock";
import { UPI_SUBMISSIONS_PATH, DATA_DIR } from "./paths";
import type { CanvasSide } from "./sides";
import { normalizePaymentReference } from "./payment-reference";

export type UpiSubmissionStatus =
  | "pending"
  | "matched"
  | "fulfilled"
  | "rejected";

export type UpiSubmission = {
  id: string;
  status: UpiSubmissionStatus;
  utr: string;
  utrNormalized: string;
  side: CanvasSide;
  type: "single" | "bulk";
  x?: number;
  y?: number;
  count?: number;
  amountInr: number;
  createdAt: string;
  contactEmail?: string;
  statementLineId?: string;
  statementUploadId?: string;
  matchedAt?: string;
  fulfilledAt?: string;
  purchaseId?: string;
  rejectReason?: string;
};

async function readAll(): Promise<UpiSubmission[]> {
  try {
    const raw = await fs.readFile(UPI_SUBMISSIONS_PATH, "utf8");
    return raw
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as UpiSubmission);
  } catch {
    return [];
  }
}

async function writeAll(rows: UpiSubmission[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const body = rows.length ? `${rows.map((r) => JSON.stringify(r)).join("\n")}\n` : "";
  await fs.writeFile(UPI_SUBMISSIONS_PATH, body, "utf8");
}

export async function listUpiSubmissions(filter?: {
  status?: UpiSubmissionStatus;
  limit?: number;
}): Promise<UpiSubmission[]> {
  let rows = await readAll();
  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (filter?.status) rows = rows.filter((r) => r.status === filter.status);
  if (filter?.limit) rows = rows.slice(0, filter.limit);
  return rows;
}

export async function getUpiSubmissionById(id: string): Promise<UpiSubmission | null> {
  const rows = await readAll();
  return rows.find((r) => r.id === id) ?? null;
}

export async function findSubmissionByUtr(utrNormalized: string): Promise<UpiSubmission | null> {
  const rows = await readAll();
  return (
    rows.find(
      (r) =>
        r.utrNormalized === utrNormalized &&
        r.status !== "rejected",
    ) ?? null
  );
}

export function amountForPixelOrder(input: {
  type: "single" | "bulk";
  count?: number;
}): number {
  if (input.type === "single") return PRICE_PER_PIXEL_INR;
  return (input.count ?? 0) * PRICE_PER_PIXEL_INR;
}

export async function createUpiSubmission(input: {
  utr: string;
  side: CanvasSide;
  type: "single" | "bulk";
  x?: number;
  y?: number;
  count?: number;
  contactEmail?: string;
}): Promise<UpiSubmission> {
  const utrNormalized = normalizePaymentReference(input.utr);
  if (!utrNormalized || utrNormalized.length < 10) {
    throw new Error("Enter a valid UPI reference number (UTR).");
  }

  const amountInr = amountForPixelOrder(input);

  return withFileLock("upi-submissions", async () => {
    const rows = await readAll();
    const duplicate = rows.find(
      (r) => r.utrNormalized === utrNormalized && r.status !== "rejected",
    );
    if (duplicate) {
      throw new Error("This UPI reference was already submitted.");
    }

    const record: UpiSubmission = {
      id: randomUUID(),
      status: "pending",
      utr: input.utr.trim(),
      utrNormalized,
      side: input.side,
      type: input.type,
      x: input.type === "single" ? input.x : undefined,
      y: input.type === "single" ? input.y : undefined,
      count: input.type === "bulk" ? input.count : undefined,
      amountInr,
      createdAt: new Date().toISOString(),
      contactEmail: input.contactEmail?.trim() || undefined,
    };

    rows.push(record);
    await writeAll(rows);
    return record;
  });
}

export async function updateUpiSubmission(
  id: string,
  patch: Partial<UpiSubmission>,
): Promise<UpiSubmission | null> {
  return withFileLock("upi-submissions", async () => {
    const rows = await readAll();
    const idx = rows.findIndex((r) => r.id === id);
    if (idx < 0) return null;
    rows[idx] = { ...rows[idx]!, ...patch };
    await writeAll(rows);
    return rows[idx]!;
  });
}
