import { randomBytes, randomUUID } from "crypto";
import { promises as fs } from "fs";
import { getEbookById } from "./ebooks";
import { withFileLock } from "./file-lock";
import { DATA_DIR, EBOOK_PURCHASES_PATH } from "./paths";

export type EbookPurchaseResult = {
  kind: "ebook";
  id: string;
  productId: string;
  productName: string;
  slug: string;
  totalInr: number;
  purchasedAt: string;
  downloadToken: string;
  cashfreeOrderId?: string;
  cashfreePaymentId?: string;
};

type EbookPurchaseRecord = EbookPurchaseResult & {
  tokenExpiresAt: string;
};

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function newDownloadToken() {
  return randomBytes(32).toString("hex");
}

async function appendRecord(record: EbookPurchaseRecord) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.appendFile(EBOOK_PURCHASES_PATH, `${JSON.stringify(record)}\n`, "utf8");
}

async function readAllRecords(): Promise<EbookPurchaseRecord[]> {
  try {
    const raw = await fs.readFile(EBOOK_PURCHASES_PATH, "utf8");
    return raw
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as EbookPurchaseRecord);
  } catch {
    return [];
  }
}

export async function fulfillEbookPurchase(input: {
  productId: string;
  cashfreeOrderId: string;
  cashfreePaymentId: string;
}): Promise<EbookPurchaseResult> {
  const ebook = getEbookById(input.productId);
  if (!ebook) throw new Error("Unknown ebook product.");

  const purchasedAt = new Date().toISOString();
  const downloadToken = newDownloadToken();
  const tokenExpiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

  const record: EbookPurchaseRecord = {
    kind: "ebook",
    id: randomUUID(),
    productId: ebook.id,
    productName: ebook.name,
    slug: ebook.slug,
    totalInr: ebook.priceInr,
    purchasedAt,
    downloadToken,
    cashfreeOrderId: input.cashfreeOrderId,
    cashfreePaymentId: input.cashfreePaymentId,
    tokenExpiresAt,
  };

  await withFileLock("ebook-purchases", async () => {
    await appendRecord(record);
  });

  return {
    kind: "ebook",
    id: record.id,
    productId: record.productId,
    productName: record.productName,
    slug: record.slug,
    totalInr: record.totalInr,
    purchasedAt: record.purchasedAt,
    downloadToken: record.downloadToken,
    cashfreeOrderId: record.cashfreeOrderId,
    cashfreePaymentId: record.cashfreePaymentId,
  };
}

export async function findEbookPurchaseByToken(
  token: string,
): Promise<EbookPurchaseRecord | null> {
  const records = await readAllRecords();
  return records.find((r) => r.downloadToken === token) ?? null;
}

export function isDownloadTokenValid(record: EbookPurchaseRecord): boolean {
  return new Date(record.tokenExpiresAt).getTime() > Date.now();
}
