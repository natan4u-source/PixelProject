"use client";

type Props = {
  open: boolean;
  amountInr: number;
  razorpayUrl: string;
  onPaid: () => void;
  onCancel: () => void;
};

export function RazorpayCheckoutOverlay({
  open,
  amountInr,
  razorpayUrl,
  onPaid,
  onCancel,
}: Props) {
  if (!open) return null;

  const amountLabel = `₹${amountInr.toLocaleString("en-IN")}`;

  const openRazorpay = () => {
    window.open(razorpayUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="razorpay-checkout-title"
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/15 bg-[var(--surface-elevated)] p-6 shadow-2xl">
        <p
          id="razorpay-checkout-title"
          className="text-center text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--kamal-bright)]"
        >
          Pay with Razorpay
        </p>
        <h2 className="mt-3 text-center text-2xl font-bold text-white">{amountLabel}</h2>
        <p className="mt-2 text-center text-sm text-white/65">
          Pay <strong className="text-white">{amountLabel}</strong> on the Razorpay page, then return
          here and enter your payment ID.
        </p>

        <button
          type="button"
          onClick={onPaid}
          className="mt-5 w-full rounded-xl border border-white/20 py-3 text-sm font-semibold text-white hover:bg-white/5"
        >
          I&apos;ve paid — enter payment ID
        </button>

        <button
          type="button"
          onClick={openRazorpay}
          className="mt-3 w-full rounded-xl bg-[#0c2451] py-4 text-base font-bold text-white hover:bg-[#153066]"
        >
          Open Razorpay to pay {amountLabel}
        </button>

        <p className="mt-4 text-center text-xs text-white/45">
          Opens Ninetyone Software Solutions on Razorpay in a new tab.
        </p>

        <button
          type="button"
          onClick={onCancel}
          className="mt-4 w-full text-center text-xs text-white/40 underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
