import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { detectPricing } from "@/lib/pricing";
import { RAZORPAY_CONFIG, toSmallestUnit } from "@/lib/payment-config";

// POST /api/payment/create-order
// Body: { billingCycle: "monthly" | "yearly" }
// Creates a Razorpay order and returns the order ID + amount + key.
export async function POST(req: NextRequest) {
  try {
    const { billingCycle } = await req.json();
    const plan = detectPricing();
    const amount = billingCycle === "yearly" ? plan.yearly : plan.monthly;

    // For India (INR), Razorpay works natively.
    // For international (USD/EUR), Razorpay needs international payments
    // activated on your account. We try anyway and fall back gracefully.
    const currency = plan.currency === "INR" ? "INR" : "USD";
    const amountInSmallestUnit = toSmallestUnit(amount, currency);

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: RAZORPAY_CONFIG.keyId,
      key_secret: RAZORPAY_CONFIG.keySecret,
    });

    // Create order
    const order = await razorpay.orders.create({
      amount: amountInSmallestUnit,
      currency,
      receipt: `voxai_${billingCycle}_${Date.now()}`,
      notes: {
        product: "VoxAI Premium",
        billing_cycle: billingCycle,
        country: plan.countryCode,
        tier: plan.tier,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_CONFIG.keyId, // Public key, safe to expose
      plan: {
        country: plan.countryName,
        currency: plan.currency,
        currencySymbol: plan.currencySymbol,
        monthly: plan.monthly,
        yearly: plan.yearly,
        monthlyDisplay: plan.monthlyDisplay,
        yearlyDisplay: plan.yearlyDisplay,
      },
    });
  } catch (err) {
    console.error("Create order error:", err);
    const msg = err instanceof Error ? err.message : "Failed to create order";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
