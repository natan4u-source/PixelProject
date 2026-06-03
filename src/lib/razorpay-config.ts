export const DEFAULT_RAZORPAY_PAYMENT_URL =
  "https://razorpay.me/@ninetyonesoftwaresolutions";

export function getRazorpayPaymentUrl() {
  return (
    process.env.NEXT_PUBLIC_RAZORPAY_PAYMENT_URL?.trim() ||
    DEFAULT_RAZORPAY_PAYMENT_URL
  );
}
