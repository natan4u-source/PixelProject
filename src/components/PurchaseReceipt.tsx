"use client";

export type ReceiptPixel = {
  x: number;
  y: number;
  color: string;
};

export type PurchaseReceiptData = {
  id: string;
  type: "single" | "bulk";
  purchasedAt: string;
  totalInr: number;
  pixels: ReceiptPixel[];
};

type Props = {
  receipt: PurchaseReceiptData | null;
  onClose: () => void;
};

export function PurchaseReceipt({ receipt, onClose }: Props) {
  if (!receipt) return null;

  const date = new Date(receipt.purchasedAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const shortId = receipt.id.slice(0, 8).toUpperCase();

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        <div className="border-b border-[var(--border)] px-6 py-5 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Receipt</p>
          <h2 id="receipt-title" className="mt-1 text-2xl font-bold">
            Purchase confirmed
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Thank you for your purchase</p>
        </div>

        <div className="space-y-3 px-6 py-4 text-sm">
          <ReceiptRow label="Receipt #" value={shortId} mono />
          <ReceiptRow label="Date" value={date} />
          <ReceiptRow
            label="Type"
            value={receipt.type === "bulk" ? "Random bulk buy" : "Single pixel"}
          />
          <ReceiptRow
            label="Pixels"
            value={receipt.pixels.length.toLocaleString("en-IN")}
          />
          <ReceiptRow
            label="Total paid"
            value={`₹${receipt.totalInr.toLocaleString("en-IN")}`}
            highlight
          />
        </div>

        <div className="mx-6 border-t border-dashed border-[var(--border)]" />

        <div className="min-h-0 flex-1 px-6 py-4">
          <p className="mb-3 text-xs uppercase tracking-wide text-[var(--muted)]">
            Your pixel{receipt.pixels.length === 1 ? "" : "s"}
          </p>
          <div className="max-h-64 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg)]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[var(--bg)]">
                <tr className="text-left text-xs text-[var(--muted)]">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Position</th>
                  <th className="px-3 py-2">Revealed color</th>
                </tr>
              </thead>
              <tbody>
                {receipt.pixels.map((pixel, i) => (
                  <tr key={`${pixel.x},${pixel.y}`} className="border-t border-[var(--border)]/40">
                    <td className="px-3 py-2 text-[var(--muted)]">{i + 1}</td>
                    <td className="px-3 py-2 font-mono">
                      ({pixel.x}, {pixel.y})
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="inline-block h-4 w-4 shrink-0 rounded border border-[var(--border)]"
                          style={{ backgroundColor: pixel.color }}
                        />
                        <span className="font-mono text-xs">{pixel.color}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-t border-[var(--border)] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-[var(--accent)] py-3 font-semibold text-black"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[var(--muted)]">{label}</span>
      <span
        className={`${mono ? "font-mono" : ""} ${highlight ? "font-semibold text-[var(--accent)]" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
