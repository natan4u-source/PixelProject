import { buildUpiPayUri, buildUpiQueryString } from "./upi-uri";

export type UpiPayInput = {
  vpa: string;
  payeeName: string;
  amountInr: number;
  note?: string;
};

export type UpiAppId = "phonepe" | "gpay" | "paytm" | "any";

export const UPI_APP_OPTIONS: {
  id: UpiAppId;
  label: string;
  shortLabel: string;
  className: string;
}[] = [
  {
    id: "phonepe",
    label: "PhonePe",
    shortLabel: "PhonePe",
    className: "bg-[#5f259f] hover:bg-[#4a1d7c] text-white",
  },
  {
    id: "gpay",
    label: "Google Pay",
    shortLabel: "GPay",
    className: "bg-[#1a73e8] hover:bg-[#1557b0] text-white",
  },
  {
    id: "paytm",
    label: "Paytm",
    shortLabel: "Paytm",
    className: "bg-[#00baf2] hover:bg-[#0099cc] text-black",
  },
];

type UpiAppSpec = {
  androidPackage: string;
  /** Primary deep link (iOS / fallback). */
  primaryUri: (query: string) => string;
  /** Extra schemes if primary does not open the app. */
  fallbackUris?: (query: string) => string[];
};

const UPI_APP_SPECS: Record<Exclude<UpiAppId, "any">, UpiAppSpec> = {
  phonepe: {
    androidPackage: "com.phonepe.app",
    primaryUri: (q) => `phonepe://upi/pay?${q}`,
  },
  gpay: {
    androidPackage: "com.google.android.apps.nbu.paisa.user",
    primaryUri: (q) => `tez://upi/pay?${q}`,
    fallbackUris: (q) => [`gpay://upi/pay?${q}`, `googlepay://upi/pay?${q}`],
  },
  paytm: {
    androidPackage: "net.one97.paytm",
    primaryUri: (q) => `paytmmp://upi/pay?${q}`,
    fallbackUris: (q) => [`paytmmp://pay?${q}`],
  },
};

/**
 * Android: NPCI UPI intent (mode=04) routed into the target app package.
 * Same pattern for PhonePe, GPay, and Paytm — avoids “QR from gallery” flows.
 */
export function buildAndroidAppIntent(appId: UpiAppId, input: UpiPayInput): string | null {
  const q = buildUpiQueryString(input);
  if (appId === "any") {
    return `intent://pay?${q}#Intent;scheme=upi;package=;end;`;
  }
  const spec = UPI_APP_SPECS[appId];
  return `intent://pay?${q}#Intent;scheme=upi;package=${spec.androidPackage};end;`;
}

export function buildUpiAppUri(appId: UpiAppId, input: UpiPayInput): string {
  const q = buildUpiQueryString(input);
  if (appId === "any") return buildUpiPayUri(input);
  return UPI_APP_SPECS[appId].primaryUri(q);
}

export function getUpiAppFallbackUris(appId: UpiAppId, input: UpiPayInput): string[] {
  if (appId === "any") return [];
  const q = buildUpiQueryString(input);
  return UPI_APP_SPECS[appId].fallbackUris?.(q) ?? [];
}

export function isAndroidUserAgent() {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

function navigateToUri(uri: string) {
  const anchor = document.createElement("a");
  anchor.href = uri;
  anchor.rel = "noopener noreferrer";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

function tryFallbackUris(uris: string[], index: number) {
  if (index >= uris.length) return;
  window.setTimeout(() => {
    try {
      window.location.assign(uris[index]!);
    } catch {
      // ignore
    }
    tryFallbackUris(uris, index + 1);
  }, 700);
}

/** Open a specific UPI app with amount and VPA pre-filled. Call from a user click. */
export function openUpiApp(appId: UpiAppId, input: UpiPayInput): void {
  if (typeof window === "undefined") return;

  if (isAndroidUserAgent()) {
    const intent = buildAndroidAppIntent(appId, input);
    if (intent) {
      navigateToUri(intent);
      return;
    }
  }

  navigateToUri(buildUpiAppUri(appId, input));
  const fallbacks = getUpiAppFallbackUris(appId, input);
  if (fallbacks.length > 0) {
    tryFallbackUris(fallbacks, 0);
  }
}

/** Generic UPI chooser (any installed app). */
export function openUpiPayment(input: UpiPayInput): void {
  openUpiApp("any", input);
}

export function buildUpiPaymentUri(input: UpiPayInput) {
  return buildUpiPayUri(input);
}
