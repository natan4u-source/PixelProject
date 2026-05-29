"use client";

import { getAdminApiBase } from "@/lib/admin-path";
import { SIDE_INFO, type CanvasSide } from "@/lib/sides";
import { useCallback, useState } from "react";

const ADMIN_API = getAdminApiBase();

type UpiSubmission = {
  id: string;
  status: string;
  utr: string;
  utrNormalized: string;
  side: CanvasSide;
  type: "single" | "bulk";
  x?: number;
  y?: number;
  count?: number;
  amountInr: number;
  createdAt: string;
  purchaseId?: string;
};

type Props = {
  secret: string;
};

export function AdminUpiPanel({ secret }: Props) {
  const [submissions, setSubmissions] = useState<UpiSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fulfilling, setFulfilling] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("pending");

  const load = useCallback(async () => {
    if (!secret) return;
    setLoading(true);
    setError(null);
    try {
      const q = filter ? `?status=${encodeURIComponent(filter)}&` : "?";
      const res = await fetch(`${ADMIN_API}/upi/submissions${q}t=${Date.now()}`, {
        headers: { "x-admin-secret": secret },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load UPI submissions.");
        return;
      }
      setSubmissions(data.submissions ?? []);
    } catch {
      setError("Could not reach server.");
    } finally {
      setLoading(false);
    }
  }, [secret, filter]);

  const handleUpload = async (file: File) => {
    if (!secret) return;
    setUploading(true);
    setMessage(null);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${ADMIN_API}/upi/upload-statement`, {
        method: "POST",
        headers: { "x-admin-secret": secret },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
        return;
      }
      setMessage(
        `Statement parsed: ${data.upload?.lineCount ?? 0} rows. Auto-matched: ${data.matchedCount ?? 0}.`,
      );
      await load();
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const fulfillOne = async (submissionId: string) => {
    if (!secret) return;
    setError(null);
    const res = await fetch(`${ADMIN_API}/upi/fulfill`, {
      method: "POST",
      headers: {
        "x-admin-secret": secret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ submissionId, action: "fulfill" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Fulfill failed.");
      return;
    }
    setMessage(`Fulfilled — purchase ${data.purchaseId?.slice(0, 8)}…`);
    await load();
  };

  const fulfillAllMatched = async () => {
    if (!secret) return;
    setFulfilling(true);
    setError(null);
    try {
      const res = await fetch(`${ADMIN_API}/upi/fulfill-batch`, {
        method: "POST",
        headers: { "x-admin-secret": secret },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Batch fulfill failed.");
        return;
      }
      setMessage(`Batch: ${data.succeeded}/${data.processed} fulfilled.`);
      await load();
    } finally {
      setFulfilling(false);
    }
  };

  const rejectOne = async (submissionId: string) => {
    if (!secret) return;
    const res = await fetch(`${ADMIN_API}/upi/fulfill`, {
      method: "POST",
      headers: {
        "x-admin-secret": secret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ submissionId, action: "reject" }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Reject failed.");
      return;
    }
    await load();
  };

  return (
    <section className="mt-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <h2 className="text-xl font-bold">UPI payments</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Users pay via QR / UPI ID, submit UTR + team. Upload bank CSV to match, then fulfill to open
        pixels.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {["pending", "matched", "fulfilled", "rejected", ""].map((s) => (
          <button
            key={s || "all"}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              filter === s ? "border-[var(--accent)] bg-[var(--accent)]/10" : "border-[var(--border)]"
            }`}
          >
            {s || "all"}
          </button>
        ))}
        <button
          type="button"
          onClick={load}
          disabled={!secret || loading}
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm disabled:opacity-50"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <label className="block">
          <span className="text-sm text-[var(--muted)]">Bank statement CSV</span>
          <input
            type="file"
            accept=".csv,text/csv"
            disabled={!secret || uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleUpload(f);
              e.target.value = "";
            }}
            className="mt-1 block text-sm"
          />
        </label>
        <button
          type="button"
          disabled={!secret || fulfilling}
          onClick={() => void fulfillAllMatched()}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          {fulfilling ? "Fulfilling…" : "Fulfill all matched"}
        </button>
      </div>

      {message && <p className="mt-3 text-sm text-emerald-400">{message}</p>}
      {error && (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--muted)]">
              <th className="py-2 pr-3">UTR</th>
              <th className="py-2 pr-3">₹</th>
              <th className="py-2 pr-3">Team</th>
              <th className="py-2 pr-3">Order</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-[var(--muted)]">
                  No submissions. Click Refresh after users submit claims.
                </td>
              </tr>
            ) : (
              submissions.map((s) => (
                <tr key={s.id} className="border-b border-[var(--border)]/60">
                  <td className="py-2 pr-3 font-mono text-xs">{s.utrNormalized}</td>
                  <td className="py-2 pr-3">{s.amountInr}</td>
                  <td className="py-2 pr-3">{SIDE_INFO[s.side].shortLabel}</td>
                  <td className="py-2 pr-3 text-xs">
                    {s.type === "single" ? `(${s.x}, ${s.y})` : `bulk ×${s.count}`}
                  </td>
                  <td className="py-2 pr-3">{s.status}</td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-2">
                      {(s.status === "pending" || s.status === "matched") && (
                        <button
                          type="button"
                          onClick={() => void fulfillOne(s.id)}
                          className="text-xs text-[var(--accent)] underline"
                        >
                          Fulfill
                        </button>
                      )}
                      {s.status === "pending" && (
                        <button
                          type="button"
                          onClick={() => void rejectOne(s.id)}
                          className="text-xs text-red-400 underline"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
