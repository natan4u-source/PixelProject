"use client";

import { useEffect, useState } from "react";
import { generateReceiptShareImage, type ShareReceiptInput } from "@/lib/receipt-share-image";

const MOCK_KAMAL: ShareReceiptInput = {
  id: "518e5649-preview",
  type: "single",
  purchasedAt: new Date().toISOString(),
  totalInr: 50,
  side: "a",
  pixels: [{ x: 512, y: 480, color: "#e8a050" }],
};

const MOCK_COCKROACH: ShareReceiptInput = {
  id: "a91f2c10-preview",
  type: "single",
  purchasedAt: new Date().toISOString(),
  totalInr: 50,
  side: "b",
  pixels: [{ x: 498, y: 520, color: "#4ade80" }],
};

export default function SharePreviewPage() {
  const [kamalUrl, setKamalUrl] = useState<string | null>(null);
  const [cockroachUrl, setCockroachUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let kUrl: string | null = null;
    let cUrl: string | null = null;

    (async () => {
      try {
        const [kBlob, cBlob] = await Promise.all([
          generateReceiptShareImage(MOCK_KAMAL),
          generateReceiptShareImage(MOCK_COCKROACH),
        ]);
        kUrl = URL.createObjectURL(kBlob);
        cUrl = URL.createObjectURL(cBlob);
        setKamalUrl(kUrl);
        setCockroachUrl(cUrl);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Preview failed");
      }
    })();

    return () => {
      if (kUrl) URL.revokeObjectURL(kUrl);
      if (cUrl) URL.revokeObjectURL(cUrl);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-10 text-white">
      <h1 className="text-center text-2xl font-bold">Share card previews (exact canvas output)</h1>
      <p className="mt-2 text-center text-sm text-white/50">
        Dev preview — same images generated after a real purchase
      </p>
      {error && <p className="mt-4 text-center text-red-400">{error}</p>}
      <div className="mx-auto mt-10 grid max-w-5xl gap-10 md:grid-cols-2">
        <PreviewCard title="Team Kamal" url={kamalUrl} />
        <PreviewCard title="Team Cockroach" url={cockroachUrl} />
      </div>
    </div>
  );
}

function PreviewCard({ title, url }: { title: string; url: string | null }) {
  return (
    <div>
      <h2 className="mb-3 text-center text-lg font-semibold text-[var(--kamal-bright)]">{title}</h2>
      <div className="overflow-hidden rounded-xl border border-white/15 bg-black/40">
        {!url ? (
          <div className="flex min-h-[320px] items-center justify-center text-sm text-white/40">
            Generating…
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={title} className="w-full object-contain" />
        )}
      </div>
    </div>
  );
}
