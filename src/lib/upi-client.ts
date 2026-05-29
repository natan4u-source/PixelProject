import { buildUpiPayUri } from "./upi-uri";

export type UpiPayInput = {
  vpa: string;
  payeeName: string;
  amountInr: number;
  note?: string;
};

export function isMobileUserAgent() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

export function isAndroidUserAgent() {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

/** Android Chrome: intent URL improves app-chooser behaviour vs raw upi:// links. */
export function buildAndroidUpiIntent(upiUri: string) {
  const query = upiUri.replace(/^upi:\/\/pay\?/i, "");
  return `intent://pay?${query}#Intent;scheme=upi;package=;end;`;
}

/**
 * Open the device UPI app with VPA and amount pre-filled (similar to Cashfree UPI sheet).
 * Must run from a direct user gesture when possible.
 */
export function openUpiPayment(input: UpiPayInput): void {
  if (typeof window === "undefined") return;

  const upiUri = buildUpiPayUri(input);
  const href = isAndroidUserAgent() ? buildAndroidUpiIntent(upiUri) : upiUri;

  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.rel = "noopener noreferrer";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  if (isAndroidUserAgent()) {
    window.setTimeout(() => {
      try {
        window.location.assign(upiUri);
      } catch {
        // ignore
      }
    }, 400);
  }
}

export function buildUpiPaymentUri(input: UpiPayInput) {
  return buildUpiPayUri(input);
}
