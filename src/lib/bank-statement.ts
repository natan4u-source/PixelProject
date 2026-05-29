import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import { withFileLock } from "./file-lock";
import { DATA_DIR, UPI_STATEMENT_UPLOADS_PATH } from "./paths";
import { normalizeUtr } from "./upi-uri";
import {
  listUpiSubmissions,
  updateUpiSubmission,
  type UpiSubmission,
} from "./upi-submissions";

export type StatementLine = {
  id: string;
  uploadId: string;
  utrNormalized: string;
  amountInr: number;
  rawDate?: string;
  description?: string;
  matchedSubmissionId?: string;
};

export type StatementUpload = {
  id: string;
  uploadedAt: string;
  fileName: string;
  lineCount: number;
  lines: StatementLine[];
};

type Store = { uploads: StatementUpload[] };

async function readStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(UPI_STATEMENT_UPLOADS_PATH, "utf8");
    return JSON.parse(raw) as Store;
  } catch {
    return { uploads: [] };
  }
}

async function writeStore(store: Store) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(UPI_STATEMENT_UPLOADS_PATH, JSON.stringify(store, null, 2), "utf8");
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

function headerIndex(headers: string[], patterns: RegExp[]): number {
  const lower = headers.map((h) => h.toLowerCase());
  for (const pat of patterns) {
    const idx = lower.findIndex((h) => pat.test(h));
    if (idx >= 0) return idx;
  }
  return -1;
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[₹,\s]/g, "").replace(/[^\d.-]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

function extractUtrFromCell(text: string): string {
  const normalized = normalizeUtr(text);
  if (normalized.length >= 10) return normalized;
  const digits = text.replace(/\D/g, "");
  if (digits.length >= 12) return digits.slice(-12);
  return normalized;
}

export function parseBankStatementCsv(csvText: string): Omit<StatementLine, "id" | "uploadId">[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headerCells = parseCsvLine(lines[0]!);
  const utrCol = headerIndex(headerCells, [
    /utr/,
    /upi.?ref/,
    /reference/,
    /ref\.?\s*no/,
    /transaction.?id/,
    /txn.?id/,
    /remarks/,
    /narration/,
  ]);
  const amountCol = headerIndex(headerCells, [
    /credit/,
    /^amount$/,
    /deposit/,
    /received/,
    /cr\.?\s*amount/,
  ]);
  const dateCol = headerIndex(headerCells, [/date/, /value\s*date/, /txn\s*date/]);
  const descCol = headerIndex(headerCells, [/description/, /narration/, /particular/]);

  const results: Omit<StatementLine, "id" | "uploadId">[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]!);
    if (cells.length < 2) continue;

    let utrRaw = "";
    let amountRaw = "";

    if (utrCol >= 0 && amountCol >= 0) {
      utrRaw = cells[utrCol] ?? "";
      amountRaw = cells[amountCol] ?? "";
    } else {
      for (const cell of cells) {
        const amt = parseAmount(cell);
        if (amt !== null && amt >= 1 && !amountRaw) {
          amountRaw = cell;
          continue;
        }
        const maybeUtr = extractUtrFromCell(cell);
        if (maybeUtr.length >= 10 && !utrRaw) utrRaw = cell;
      }
    }

    const utrNormalized = extractUtrFromCell(utrRaw);
    const amountInr = parseAmount(amountRaw);
    if (!utrNormalized || utrNormalized.length < 10 || amountInr === null) continue;

    results.push({
      utrNormalized,
      amountInr,
      rawDate: dateCol >= 0 ? cells[dateCol] : undefined,
      description: descCol >= 0 ? cells[descCol] : undefined,
    });
  }

  return results;
}

export async function saveStatementUpload(
  fileName: string,
  parsed: Omit<StatementLine, "id" | "uploadId">[],
): Promise<StatementUpload> {
  const uploadId = randomUUID();
  const upload: StatementUpload = {
    id: uploadId,
    uploadedAt: new Date().toISOString(),
    fileName,
    lineCount: parsed.length,
    lines: parsed.map((p) => ({
      ...p,
      id: randomUUID(),
      uploadId,
    })),
  };

  await withFileLock("upi-statement", async () => {
    const store = await readStore();
    store.uploads.unshift(upload);
    if (store.uploads.length > 50) store.uploads = store.uploads.slice(0, 50);
    await writeStore(store);
  });

  return upload;
}

export async function reconcileStatementUpload(uploadId: string): Promise<{
  upload: StatementUpload;
  matched: { submission: UpiSubmission; line: StatementLine }[];
  unmatchedSubmissions: UpiSubmission[];
  unmatchedLines: StatementLine[];
}> {
  const store = await readStore();
  const upload = store.uploads.find((u) => u.id === uploadId);
  if (!upload) throw new Error("Statement upload not found.");

  const pending = (await listUpiSubmissions()).filter((s) => s.status === "pending");
  const matched: { submission: UpiSubmission; line: StatementLine }[] = [];
  const usedSubmission = new Set<string>();
  const usedLine = new Set<string>();

  for (const line of upload.lines) {
    if (line.matchedSubmissionId) continue;
    const sub = pending.find(
      (s) =>
        !usedSubmission.has(s.id) &&
        s.utrNormalized === line.utrNormalized &&
        Math.abs(s.amountInr - line.amountInr) < 0.02,
    );
    if (!sub) continue;

    usedSubmission.add(sub.id);
    usedLine.add(line.id);
    line.matchedSubmissionId = sub.id;

    const updated = await updateUpiSubmission(sub.id, {
      status: "matched",
      statementLineId: line.id,
      statementUploadId: uploadId,
      matchedAt: new Date().toISOString(),
    });
    if (updated) matched.push({ submission: updated, line });
  }

  await withFileLock("upi-statement", async () => {
    const s = await readStore();
    const idx = s.uploads.findIndex((u) => u.id === uploadId);
    if (idx >= 0) s.uploads[idx] = upload;
    await writeStore(s);
  });

  const stillPending = (await listUpiSubmissions()).filter((s) => s.status === "pending");
  const unmatchedLines = upload.lines.filter(
    (l) => !l.matchedSubmissionId && !usedLine.has(l.id),
  );

  return {
    upload,
    matched,
    unmatchedSubmissions: stillPending,
    unmatchedLines,
  };
}

export async function listStatementUploads(limit = 10): Promise<StatementUpload[]> {
  const store = await readStore();
  return store.uploads.slice(0, limit);
}
