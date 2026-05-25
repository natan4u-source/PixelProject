export type CashfreeCheckoutResult = {
  orderId: string;
};

type CashfreeCheckoutInstance = {
  checkout: (options: {
    paymentSessionId: string;
    redirectTarget?: "_self" | "_blank" | "_modal" | "_top" | "_parent";
  }) => Promise<{
    error?: { message?: string };
    redirect?: boolean;
    paymentDetails?: {
      paymentMessage?: string;
    };
  }>;
};

declare global {
  interface Window {
    Cashfree?: (options: { mode: "sandbox" | "production" }) => CashfreeCheckoutInstance;
  }
}

export function loadCashfreeScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Cashfree) return Promise.resolve(true);

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => resolve(Boolean(window.Cashfree));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function openCashfreeCheckout(
  paymentSessionId: string,
  mode: "sandbox" | "production",
): Promise<CashfreeCheckoutResult> {
  const loaded = await loadCashfreeScript();
  if (!loaded || !window.Cashfree) {
    throw new Error("Could not load Cashfree checkout.");
  }

  const cashfree = window.Cashfree({ mode });
  const result = await cashfree.checkout({
    paymentSessionId,
    redirectTarget: "_modal",
  });

  if (result.error) {
    throw new Error(result.error.message ?? "Payment failed or was cancelled.");
  }

  return { orderId: "" };
}
