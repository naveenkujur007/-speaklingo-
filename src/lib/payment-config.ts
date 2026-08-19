// Payment configuration.

export const RAZORPAY_CONFIG = {
  keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_TKIt312RSPrZ7s",
  keySecret: process.env.RAZORPAY_KEY_SECRET || "",
};

// Your UPI ID for direct QR payments (India only, no gateway fees).
// @okaxis is Google Pay's default UPI handle, NOT Axis Bank.
// Linked bank is SBI (State Bank of India).
export const UPI_CONFIG = {
  upiId: "naveenkujur077-3@okaxis",
  payeeName: "Naveen Kujur",
  note: "SpeakLingo Premium Subscription",
};

export function toSmallestUnit(amount: number, currency: string): number {
  return Math.round(amount * 100);
}

export function isRazorpayConfigured(): boolean {
  return (
    !!process.env.RAZORPAY_KEY_ID &&
    !!process.env.RAZORPAY_KEY_SECRET &&
    process.env.RAZORPAY_KEY_SECRET.length > 0
  );
}

// ============================================================
// PAYPAL CONFIG — for international payments (USA, Europe, etc.)
// PayPal me paisa sidha tumhare PayPal account me aata hai.
// Phir bank me transfer kar sakte ho ( withdrawal fee: ~$5 ).
//
// SETUP DONE ✅ — email: naveenkujur077@gmail.com
// ============================================================
export const PAYPAL_CONFIG = {
  email: "naveenkujur077@gmail.com",
  payeeName: "Naveen Kujur",
  // PayPal.me link (short payment link) — optional but recommended.
  // Create yours at https://paypal.me — choose a username.
  // If you don't have one, users will send to your email instead.
  meLink: "https://paypal.me/naveenkujur077",
};

// ============================================================
// PAYONEER — DISABLED (account blocked)
// Agar future me naya Payoneer account banao, yahan details daalo
// aur PaymentMethods component me Payoneer option wapas enable kar do.
// ============================================================
export const PAYONEER_CONFIG = {
  email: "",
  payeeName: "Naveen Kujur",
  usBankName: "",
  usAccountName: "",
  usAccountNumber: "",
  usRoutingNumber: "",
  requestPaymentLink: "",
};

export function isPayoneerConfigured(): boolean {
  return PAYONEER_CONFIG.usAccountNumber.length > 0;
}
