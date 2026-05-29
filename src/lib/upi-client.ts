import { buildUpiPayUri, buildUpiQueryString, type UpiLinkInput } from "./upi-uri";

export type UpiPayInput = UpiLinkInput;

export type UpiAppId = "phonepe" | "gpay" | "paytm" | "any";

export const UPI_APP_OPTIONS: {
  id: UpiAppId;
  label: string;
  shortLabel: string;
  className: string;
  /** Paytm uses native scheme; PhonePe/GPay use package-targeted upi:// on Android. */
  openMode: "native" | "upi-package";
}[] = [
  {
    id: "phonepe",
    label: "PhonePe",
    shortLabel: "PhonePe",
    className: "bg-[#5f259f] hover:bg-[#4a1d7c] text-white",
    openMode: "upi-package",
  },
  {
    id: "gpay",
    label: "Google Pay",
    shortLabel: "GPay",
    className: "bg-[#1a73e8] hover:bg-[#1557b0] text-white",
    openMode: "upi-package",
  },
  {
    id: "paytm",
    label: "Paytm",
    shortLabel: "Paytm",
    className: "bg-[#00baf2] hover:bg-[#0099cc] text-black",
    openMode: "native",
  },
];

const ANDROID_PACKAGES: Record<Exclude<UpiAppId, "any">, string> = {
  phonepe: "com.phonepe.app",
  gpay: "com.google.android.apps.nbu.paisa.user",
  paytm: "net.one97.paytm",
};

/** Paytm — native scheme (works reliably). */
function buildPaytmUri(q: string) {
  return `paytmmp://pay?${q}`;
}

function buildPaytmIntent(q: string) {
  return `intent://pay?${q}#Intent;scheme=paytmmp;package=net.one97.paytm;end;`;
}

/**
 * PhonePe / GPay — force standard upi:// inside the app package.
 * Custom phonepe:// / tez:// links were opening “gallery QR” style screens.
 */
function buildPackageUpiIntent(packageName: string, q: string) {
  return `intent://pay?${q}#Intent;scheme=upi;package=${packageName};end;`;
}

export function buildUpiAppUri(appId: UpiAppId, input: UpiPayInput): string {
  const q = buildUpiQueryString(input);
  if (appId === "any") return buildUpiPayUri(input);
  if (appId === "paytm") return buildPaytmUri(q);
  return buildUpiPayUri({ ...input, txnRef: input.txnRef });
}

export function isAndroidUserAgent() {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

export function isMobileUserAgent() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function openUri(uri: string) {
  window.location.href = uri;
}

/** Open UPI app — one navigation only (no double redirect). */
export function openUpiApp(appId: UpiAppId, input: UpiPayInput): void {
  if (typeof window === "undefined") return;

  const payment: UpiPayInput = {
    ...input,
    txnRef: input.txnRef ?? `PX${Date.now()}`,
  };
  const q = buildUpiQueryString(payment);

  if (appId === "any") {
    openUri(buildUpiPayUri(payment));
    return;
  }

  if (isAndroidUserAgent()) {
    if (appId === "paytm") {
      openUri(buildPaytmIntent(q));
      return;
    }
    openUri(buildPackageUpiIntent(ANDROID_PACKAGES[appId], q));
    return;
  }

  if (appId === "paytm") {
    openUri(buildPaytmUri(q));
    return;
  }

  openUri(buildUpiPayUri(payment));
}

export function openUpiPayment(input: UpiPayInput): void {
  openUpiApp("any", input);
}

export function buildUpiPaymentUri(input: UpiPayInput) {
  return buildUpiPayUri(input);
}

export function getManualPaySteps(payment: UpiPayInput) {
  return {
    vpa: payment.vpa,
    amount: payment.amountInr.toFixed(2),
    note: payment.note ?? "Pixel purchase",
    payeeName: payment.payeeName,
  };
}

/** One-tap copy for Send money → UPI ID flow when deep links show the gallery banner. */
export function formatPaymentClipboard(payment: UpiPayInput) {
  const s = getManualPaySteps(payment);
  return `UPI ID: ${s.vpa}\nAmount: ₹${s.amount}\nNote: ${s.note}`;
}
