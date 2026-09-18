import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { setPaidSubscriber } from "@/lib/owner-mode";

// POST /api/payment/verify
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
// Verifies the payment signature to confirm payment is genuine.
export async function POST(req: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment parameters" },
        { status: 400 }
      );
    }

    // Verify signature: HMAC SHA256 of (order_id + "|" + payment_id)
    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Payment verification failed — invalid signature" },
        { status: 400 }
      );
    }

    // Payment verified! Mark user as paid subscriber.
    // In a real app, also store the payment record in DB.
    setPaidSubscriber(true);

    return NextResponse.json({
      verified: true,
      message: "Payment successful! Premium unlocked.",
      paymentId: razorpay_payment_id,
    });
  } catch (err) {
    console.error("Payment verification error:", err);
    const msg = err instanceof Error ? err.message : "Verification failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
