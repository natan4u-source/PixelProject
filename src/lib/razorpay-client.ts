export type RazorpayCheckoutOptions = {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
};

export type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayHandlerResponse = RazorpaySuccessResponse;

type RazorpayInstance = {
  open: () => void;
  on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: {
      key: string;
      amount: number;
      currency: string;
      name?: string;
      description?: string;
      order_id: string;
      prefill?: RazorpayCheckoutOptions["prefill"];
      theme?: { color?: string };
      handler: (response: RazorpayHandlerResponse) => void;
      modal?: { ondismiss?: () => void };
    }) => RazorpayInstance;
  }
}

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(
  options: RazorpayCheckoutOptions,
): Promise<RazorpaySuccessResponse> {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    throw new Error("Could not load Razorpay checkout.");
  }

  return new Promise((resolve, reject) => {
    const checkout = new window.Razorpay!({
      key: options.keyId,
      amount: options.amount,
      currency: options.currency,
      name: options.name ?? "Pixel Reveal",
      description: options.description ?? "Pixel purchase",
      order_id: options.orderId,
      prefill: options.prefill,
      theme: { color: "#d4a853" },
      handler: (response) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled.")),
      },
    });

    checkout.on("payment.failed", (response) => {
      reject(new Error(response.error?.description ?? "Payment failed."));
    });

    checkout.open();
  });
}
