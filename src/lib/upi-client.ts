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

export function buildUpiAppUri(appId: UpiAppId, input: UpiPayInput): string {
  const q = buildUpiQueryString(input);
  switch (appId) {
    case "phonepe":
      return `phonepe://upi/pay?${q}`;
    case "gpay":
      return `tez://upi/pay?${q}`;
    case "paytm":
      return `paytmmp://pay?${q}`;
    case "any":
      return buildUpiPayUri(input);
  }
}

const ANDROID_PACKAGES: Record<Exclude<UpiAppId, "any">, string> = {
  phonepe: "com.phonepe.app",
  gpay: "com.google.android.apps.nbu.paisa.user",
  paytm: "net.one97.paytm",
};

/** Standard UPI intent into a specific app (avoids PhonePe “gallery QR” path). */
export function buildAndroidAppIntent(appId: UpiAppId, input: UpiPayInput): string | null {
  const q = buildUpiQueryString(input);
  if (appId === "any") {
    return `intent://pay?${q}#Intent;scheme=upi;package=;end;`;
  }
  const pkg = ANDROID_PACKAGES[appId];
  return `intent://pay?${q}#Intent;scheme=upi;package=${pkg};end;`;
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

/** Open a specific UPI app with amount and VPA pre-filled. Call from a user click. */
export function openUpiApp(appId: UpiAppId, input: UpiPayInput): void {
  if (typeof window === "undefined") return;

  const appUri = buildUpiAppUri(appId, input);

  if (isAndroidUserAgent()) {
    const intent = buildAndroidAppIntent(appId, input);
    if (intent) {
      navigateToUri(intent);
      return;
    }
  }

  navigateToUri(appUri);

  if (appId === "gpay") {
    const gpayAlt = appUri.replace(/^tez:/, "gpay:");
    window.setTimeout(() => {
      try {
        window.location.assign(gpayAlt);
      } catch {
        // ignore
      }
    }, 500);
  }
}

/** Generic UPI chooser (any installed app). */
export function openUpiPayment(input: UpiPayInput): void {
  openUpiApp("any", input);
}

export function buildUpiPaymentUri(input: UpiPayInput) {
  return buildUpiPayUri(input);
}
