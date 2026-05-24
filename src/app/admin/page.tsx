"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type AdminStats = {
  grid: { width: number; height: number };
  sold: number;
  remaining: number;
  total: number;
  percentRevealed: number;
  pricePerPixelInr: number;
  revenueInr: number;
  imageReady: boolean;
  imageUploadedAt: string | null;
};

type Purchase = {
  id: string;
  type: "single" | "bulk";
  purchasedAt: string;
  pixelCount: number;
  totalInr: number;
  pixels: { x: number; y: number; color: string }[];
};

type AnalyticsSummary = {
  totalViews: number;
  uniqueVisitors: number;
  viewsToday: number;
  viewsLast7Days: number;
  topCountries: { country: string; label: string; count: number }[];
  topRegions: { label: string; count: number }[];
  topReferrers: { label: string; count: number }[];
  devices: { label: string; count: number }[];
  browsers: { label: string; count: number }[];
  recent: {
    id: string;
    ts: string;
    country: string;
    region: string;
    city: string;
    referrer: string;
    device: string;
    browser: string;
  }[];
};

const SECRET_KEY = "pixel-admin-secret";
const PAGE_SIZE = 15;

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [purchaseTotal, setPurchaseTotal] = useState(0);
  const [purchaseOffset, setPurchaseOffset] = useState(0);
  const [hasMorePurchases, setHasMorePurchases] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [purchasesLoading, setPurchasesLoading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(SECRET_KEY);
    if (saved) setSecret(saved);
  }, []);

  const loadStats = useCallback(async () => {
    if (!secret) return;
    setStatsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/stats?t=${Date.now()}`, {
        headers: { "x-admin-secret": secret },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setStats(null);
        setError(data.error ?? "Could not load stats. Check your admin secret.");
        return;
      }
      setStats(data);
      sessionStorage.setItem(SECRET_KEY, secret);
    } catch {
      setError("Could not reach the server.");
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, [secret]);

  const loadAnalytics = useCallback(async () => {
    if (!secret) return;
    setAnalyticsLoading(true);

    try {
      const res = await fetch(`/api/admin/analytics?t=${Date.now()}`, {
        headers: { "x-admin-secret": secret },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setAnalytics(null);
        return;
      }
      setAnalytics(data);
    } catch {
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [secret]);

  const loadPurchases = useCallback(
    async (offset = 0, append = false) => {
      if (!secret) return;
      setPurchasesLoading(true);

      try {
        const res = await fetch(
          `/api/admin/purchases?limit=${PAGE_SIZE}&offset=${offset}&t=${Date.now()}`,
          {
            headers: { "x-admin-secret": secret },
            cache: "no-store",
          },
        );
        const data = await res.json();
        if (!res.ok) return;

        setPurchases((prev) => (append ? [...prev, ...data.purchases] : data.purchases));
        setPurchaseTotal(data.total);
        setPurchaseOffset(offset + data.purchases.length);
        setHasMorePurchases(data.hasMore);
      } catch {
        // keep existing list
      } finally {
        setPurchasesLoading(false);
      }
    },
    [secret],
  );

  const refreshAll = useCallback(async () => {
    await loadStats();
    await loadAnalytics();
    setExpandedId(null);
    await loadPurchases(0, false);
  }, [loadStats, loadAnalytics, loadPurchases]);

  useEffect(() => {
    if (secret) {
      loadStats();
      loadAnalytics();
      loadPurchases(0, false);
    }
  }, [secret, loadStats, loadAnalytics, loadPurchases]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !secret) {
      setMessage(null);
      setError("Choose an image and enter your admin secret.");
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    const form = new FormData();
    form.append("image", file);

    const res = await fetch("/api/admin/master", {
      method: "POST",
      headers: { "x-admin-secret": secret },
      body: form,
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Upload failed.");
      return;
    }

    setMessage("Hidden image uploaded. Use Reset grid if you also want to clear sales.");
    setFile(null);
    await refreshAll();
  };

  const handleResetGrid = async () => {
    if (!secret) {
      setError("Enter your admin secret first.");
      return;
    }

    const confirmed = window.confirm(
      "Reset the grid? This clears all sold pixels and purchase history. Your hidden image stays the same.",
    );
    if (!confirmed) return;

    setLoading(true);
    setMessage(null);
    setError(null);

    const res = await fetch("/api/admin/reset-grid", {
      method: "POST",
      headers: { "x-admin-secret": secret },
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not reset grid.");
      return;
    }

    setMessage(data.message ?? "Grid reset.");
    await refreshAll();
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/" className="text-sm text-[var(--muted)] underline hover:text-[var(--text)]">
        ← Back to grid
      </Link>

      <h1 className="mt-6 text-3xl font-bold">Admin panel</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        View sales, purchase history, upload the hidden image, or reset the grid.
      </p>

      <section className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <label className="block">
          <span className="text-sm text-[var(--muted)]">Admin secret</span>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
            placeholder="From ADMIN_SECRET in .env.local"
          />
        </label>
        <button
          type="button"
          onClick={refreshAll}
          disabled={!secret || statsLoading || analyticsLoading || purchasesLoading}
          className="mt-3 rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--muted)] disabled:opacity-50"
        >
          {statsLoading || analyticsLoading || purchasesLoading ? "Loading…" : "Refresh all"}
        </button>
      </section>

      {error && (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      {stats && (
        <section className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold">Sales overview</h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label="Pixels bought" value={stats.sold.toLocaleString("en-IN")} highlight />
            <StatCard
              label="Demo revenue"
              value={`₹${stats.revenueInr.toLocaleString("en-IN")}`}
            />
            <StatCard label="Still hidden" value={stats.remaining.toLocaleString("en-IN")} />
            <StatCard label="Revealed" value={`${stats.percentRevealed.toFixed(4)}%`} />
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--muted)]">
            <p>
              Grid: {stats.grid.width}×{stats.grid.height} ({stats.total.toLocaleString("en-IN")}{" "}
              pixels total)
            </p>
            <p className="mt-1">Price: ₹{stats.pricePerPixelInr} per pixel</p>
            <p className="mt-1">
              Hidden image:{" "}
              {stats.imageReady
                ? stats.imageUploadedAt
                  ? `uploaded ${new Date(stats.imageUploadedAt).toLocaleString("en-IN")}`
                  : "ready"
                : "not uploaded yet"}
            </p>
          </div>
        </section>
      )}

      {analytics && (
        <section className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold">Visitor analytics</h2>
          <p className="text-sm text-[var(--muted)]">
            Homepage visits only. Region is estimated from IP — no personal data stored.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total views" value={analytics.totalViews.toLocaleString("en-IN")} highlight />
            <StatCard
              label="Unique visitors"
              value={analytics.uniqueVisitors.toLocaleString("en-IN")}
            />
            <StatCard label="Views today" value={analytics.viewsToday.toLocaleString("en-IN")} />
            <StatCard
              label="Last 7 days"
              value={analytics.viewsLast7Days.toLocaleString("en-IN")}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <AnalyticsList title="Top countries" items={analytics.topCountries.map((item) => ({
              label: item.label,
              count: item.count,
            }))} />
            <AnalyticsList title="Top regions" items={analytics.topRegions} />
            <AnalyticsList title="Top referrers" items={analytics.topReferrers} />
            <AnalyticsList title="Devices" items={analytics.devices} />
            <AnalyticsList title="Browsers" items={analytics.browsers} />
          </div>

          {analytics.recent.length > 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden">
              <div className="border-b border-[var(--border)] px-4 py-3">
                <h3 className="text-sm font-semibold">Recent visits</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-[var(--muted)]">
                      <th className="px-4 py-2">When</th>
                      <th className="px-4 py-2">Country</th>
                      <th className="px-4 py-2">Region</th>
                      <th className="px-4 py-2">Referrer</th>
                      <th className="px-4 py-2">Device</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.recent.map((visit) => (
                      <tr key={visit.id} className="border-t border-[var(--border)]/50">
                        <td className="px-4 py-2 whitespace-nowrap">
                          {new Date(visit.ts).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-2">{visit.country}</td>
                        <td className="px-4 py-2">
                          {[visit.city, visit.region].filter((part) => part && part !== "Unknown").join(", ") || "—"}
                        </td>
                        <td className="px-4 py-2">{visit.referrer}</td>
                        <td className="px-4 py-2 capitalize">{visit.device}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="text-lg font-semibold">Reset grid</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Hide all revealed pixels again and wipe purchase history. Does not change your uploaded
          hidden image.
        </p>
        <button
          type="button"
          onClick={handleResetGrid}
          disabled={loading || !secret || (stats?.sold ?? 0) === 0}
          className="mt-4 w-full rounded-lg border border-red-500/50 bg-red-500/10 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-40"
        >
          {loading ? "Working…" : "Reset grid"}
        </button>
      </section>

      {secret && (
        <section className="mt-10 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Purchase history</h2>
            <span className="text-sm text-[var(--muted)]">
              {purchaseTotal.toLocaleString("en-IN")} transaction(s)
            </span>
          </div>

          {purchases.length === 0 && !purchasesLoading && (
            <p className="rounded-lg border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
              No purchases yet. Sales will appear here after someone buys pixels.
            </p>
          )}

          <div className="space-y-3">
            {purchases.map((purchase) => (
              <PurchaseRow
                key={purchase.id}
                purchase={purchase}
                expanded={expandedId === purchase.id}
                onToggle={() =>
                  setExpandedId((id) => (id === purchase.id ? null : purchase.id))
                }
              />
            ))}
          </div>

          {hasMorePurchases && (
            <button
              type="button"
              onClick={() => loadPurchases(purchaseOffset, true)}
              disabled={purchasesLoading}
              className="w-full rounded-lg border border-[var(--border)] py-2.5 text-sm hover:border-[var(--muted)] disabled:opacity-50"
            >
              {purchasesLoading ? "Loading…" : "Load more"}
            </button>
          )}
        </section>
      )}

      <section className="mt-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="text-lg font-semibold">Upload hidden image</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Resizes to 1000×1000. To start fresh, use Reset grid separately.
        </p>

        <form onSubmit={handleUpload} className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm text-[var(--muted)]">Master image (PNG/JPG)</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1 w-full text-sm"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--accent)] py-3 font-semibold text-black disabled:opacity-50"
          >
            {loading ? "Uploading…" : "Upload image"}
          </button>
        </form>
      </section>

      {message && (
        <p className="mt-4 text-sm text-[var(--accent)]" role="status">
          {message}
        </p>
      )}
    </main>
  );
}

function PurchaseRow({
  purchase,
  expanded,
  onToggle,
}: {
  purchase: Purchase;
  expanded: boolean;
  onToggle: () => void;
}) {
  const previewLimit = 40;
  const preview = purchase.pixels.slice(0, previewLimit);
  const remaining = purchase.pixels.length - preview.length;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-[var(--bg)]/50"
      >
        <div>
          <p className="font-medium">
            {purchase.type === "bulk" ? "Bulk purchase" : "Single pixel"}
          </p>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            {new Date(purchase.purchasedAt).toLocaleString("en-IN")}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-semibold text-[var(--accent)]">
            ₹{purchase.totalInr.toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-[var(--muted)]">
            {purchase.pixelCount.toLocaleString("en-IN")} pixel(s)
          </p>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)] bg-[var(--bg)] px-4 py-3">
          <p className="mb-2 text-xs uppercase tracking-wide text-[var(--muted)]">Pixels</p>
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--muted)]">
                  <th className="pb-2 pr-3">Position</th>
                  <th className="pb-2">Color</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((p) => (
                  <tr key={`${p.x},${p.y}`} className="border-t border-[var(--border)]/50">
                    <td className="py-1.5 pr-3 font-mono">
                      ({p.x}, {p.y})
                    </td>
                    <td className="py-1.5">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="inline-block h-4 w-4 rounded border border-[var(--border)]"
                          style={{ backgroundColor: p.color }}
                        />
                        {p.color}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {remaining > 0 && (
            <p className="mt-2 text-xs text-[var(--muted)]">
              …and {remaining.toLocaleString("en-IN")} more pixel(s)
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-4 ${
        highlight
          ? "border-[var(--accent)]/40 bg-[var(--accent)]/10"
          : "border-[var(--border)] bg-[var(--bg)]"
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${highlight ? "text-[var(--accent)]" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function AnalyticsList({
  title,
  items,
}: {
  title: string;
  items: { label: string; count: number }[];
}) {
  const max = items[0]?.count ?? 1;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--muted)]">No data yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={`${title}-${item.label}`}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{item.label}</span>
                <span className="shrink-0 text-[var(--muted)]">{item.count}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--surface)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)]"
                  style={{ width: `${Math.max(8, (item.count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
