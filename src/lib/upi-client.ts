import { buildUpiPayUri } from "./upi-uri";

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

function buildUpiQueryString(input: UpiPayInput) {
  const params = new URLSearchParams();
  params.set("pa", input.vpa.trim());
  params.set("pn", input.payeeName.trim().slice(0, 50));
  params.set("am", input.amountInr.toFixed(2));
  params.set("cu", "INR");
  if (input.note) params.set("tn", input.note.trim().slice(0, 80));
  return params.toString();
}

export function buildUpiAppUri(appId: UpiAppId, input: UpiPayInput): string {
  const q = buildUpiQueryString(input);
  switch (appId) {
    case "phonepe":
      return `phonepe://pay?${q}`;
    case "gpay":
      return `tez://upi/pay?${q}`;
    case "paytm":
      return `paytmmp://pay?${q}`;
    case "any":
      return buildUpiPayUri(input);
  }
}

const ANDROID_PACKAGES: Record<Exclude<UpiAppId, "any">, { scheme: string; path: string; pkg: string }> =
  {
    phonepe: { scheme: "phonepe", path: "pay", pkg: "com.phonepe.app" },
    gpay: { scheme: "tez", path: "upi/pay", pkg: "com.google.android.apps.nbu.paisa.user" },
    paytm: { scheme: "paytmmp", path: "pay", pkg: "net.one97.paytm" },
  };

export function buildAndroidAppIntent(appId: UpiAppId, input: UpiPayInput): string | null {
  const q = buildUpiQueryString(input);
  if (appId === "any") {
    return `intent://pay?${q}#Intent;scheme=upi;package=;end;`;
  }
  const spec = ANDROID_PACKAGES[appId];
  return `intent://${spec.path}?${q}#Intent;scheme=${spec.scheme};package=${spec.pkg};end;`;
}

export function isAndroidUserAgent() {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

function navigateToUri(primary: string, fallback?: string) {
  const anchor = document.createElement("a");
  anchor.href = primary;
  anchor.rel = "noopener noreferrer";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  if (fallback) {
    window.setTimeout(() => {
      try {
        window.location.assign(fallback);
      } catch {
        // ignore
      }
    }, 600);
  }
}

/** Open a specific UPI app with amount and VPA pre-filled. Call from a user click. */
export function openUpiApp(appId: UpiAppId, input: UpiPayInput): void {
  if (typeof window === "undefined") return;

  const appUri = buildUpiAppUri(appId, input);
  const intent = isAndroidUserAgent() ? buildAndroidAppIntent(appId, input) : null;

  if (intent) {
    navigateToUri(intent, appUri);
    return;
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
    }, 800);
  }
}

/** Generic UPI chooser (any installed app). */
export function openUpiPayment(input: UpiPayInput): void {
  openUpiApp("any", input);
}

export function buildUpiPaymentUri(input: UpiPayInput) {
  return buildUpiPayUri(input);
}
