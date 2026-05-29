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
  /** Native scheme for Android intent (not generic upi://). */
  intentScheme: string;
  intentPath: string;
  primaryUri: (query: string) => string;
  fallbackUris?: (query: string) => string[];
};

const UPI_APP_SPECS: Record<Exclude<UpiAppId, "any">, UpiAppSpec> = {
  phonepe: {
    androidPackage: "com.phonepe.app",
    intentScheme: "phonepe",
    intentPath: "pay",
    primaryUri: (q) => `phonepe://pay?${q}`,
  },
  gpay: {
    androidPackage: "com.google.android.apps.nbu.paisa.user",
    intentScheme: "tez",
    intentPath: "upi/pay",
    primaryUri: (q) => `tez://upi/pay?${q}`,
    fallbackUris: (q) => [`gpay://upi/pay?${q}`],
  },
  paytm: {
    androidPackage: "net.one97.paytm",
    intentScheme: "paytmmp",
    intentPath: "pay",
    primaryUri: (q) => `paytmmp://pay?${q}`,
    fallbackUris: (q) => [`paytmmp://upi/pay?${q}`],
  },
};

/** Android intent via each app’s own scheme (Paytm-style). Generic upi:// broke PhonePe/GPay. */
export function buildAndroidAppIntent(appId: UpiAppId, input: UpiPayInput): string | null {
  const q = buildUpiQueryString(input);
  if (appId === "any") {
    return `intent://pay?${q}#Intent;scheme=upi;package=;end;`;
  }
  const spec = UPI_APP_SPECS[appId];
  return `intent://${spec.intentPath}?${q}#Intent;scheme=${spec.intentScheme};package=${spec.androidPackage};end;`;
}

export function buildUpiAppUri(appId: UpiAppId, input: UpiPayInput): string {
  const q = buildUpiQueryString(input);
  if (appId === "any") return buildUpiPayUri(input);
  return UPI_APP_SPECS[appId].primaryUri(q);
}

export function isAndroidUserAgent() {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

export function isMobileUserAgent() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
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

/** Open a specific UPI app — native scheme on Android (matches working Paytm flow). */
export function openUpiApp(appId: UpiAppId, input: UpiPayInput): void {
  if (typeof window === "undefined") return;

  if (isAndroidUserAgent()) {
    const intent = buildAndroidAppIntent(appId, input);
    if (intent) {
      navigateToUri(intent);
      return;
    }
  }

  const primary = buildUpiAppUri(appId, input);
  navigateToUri(primary);

  if (appId !== "any") {
    const fallbacks = UPI_APP_SPECS[appId].fallbackUris?.(buildUpiQueryString(input)) ?? [];
    if (fallbacks[0]) {
      window.setTimeout(() => {
        try {
          window.location.assign(fallbacks[0]!);
        } catch {
          // ignore
        }
      }, 600);
    }
  }
}

export function openUpiPayment(input: UpiPayInput): void {
  openUpiApp("any", input);
}

export function buildUpiPaymentUri(input: UpiPayInput) {
  return buildUpiPayUri(input);
}
