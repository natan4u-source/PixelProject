import { buildUpiPayUri, buildUpiQueryString, type UpiLinkInput } from "./upi-uri";

export type UpiPayInput = UpiLinkInput;

export type UpiAppId = "paytm";

function buildPaytmUri(q: string) {
  return `paytmmp://pay?${q}`;
}

function buildPaytmIntent(q: string) {
  return `intent://pay?${q}#Intent;scheme=paytmmp;package=net.one97.paytm;end;`;
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

/** Open Paytm with amount and VPA pre-filled. */
export function openUpiApp(_appId: UpiAppId, input: UpiPayInput): void {
  if (typeof window === "undefined") return;

  const payment: UpiPayInput = {
    ...input,
    txnRef: input.txnRef ?? `PX${Date.now()}`,
  };
  const q = buildUpiQueryString(payment);

  if (isAndroidUserAgent()) {
    openUri(buildPaytmIntent(q));
    return;
  }

  openUri(buildPaytmUri(q));
}

export function buildUpiPaymentUri(input: UpiPayInput) {
  return buildUpiPayUri(input);
}
