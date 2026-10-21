// Payment configuration.

export const RAZORPAY_CONFIG = {
  keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_TKIt312RSPrZ7s",
  keySecret: process.env.RAZORPAY_KEY_SECRET || "",
};

// Your UPI ID for direct QR payments (India only, no gateway fees).
// Updated: 2026-10-22 — new SBI UPI ID
// Linked bank: State Bank of India (SBI), account ending 9397
export const UPI_CONFIG = {
  upiId: "8709909162@sbi",
  payeeName: "Naveen Pratik Kujur",
  note: "SpeakLingo Premium Subscription",
  // Path to the QR image (stored in /public) — used by PaymentMethods
  // component to show the actual QR the user scans.
  qrImagePath: "/upi-qr-sbi.jpeg",
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
// OWNER MODE — free premium access for the project owner
// ------------------------------------------------------------
// The owner (Naveen) can unlock premium FOREVER for free by entering
// the secret access code in the Paywall dialog:
//   "Have an access code?" → enter code → premium unlocked.
// Buyers don't know this code, so they see the paywall.
//
// Code is in src/lib/owner-mode.ts (constant OWNER_CODE).
// This is by design: the owner learns for free, everyone else pays.
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
