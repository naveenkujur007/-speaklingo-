"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CreditCard, QrCode, Loader2, Check, Smartphone,
  Shield, Copy, ExternalLink, DollarSign, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { detectPricing, type PricingPlan } from "@/lib/pricing";
import { UPI_CONFIG, PAYPAL_CONFIG } from "@/lib/payment-config";
import { useMounted } from "@/hooks/use-mounted";
import QRCode from "qrcode";

interface PaymentMethodsProps {
  billingCycle: "monthly" | "yearly";
  onPaymentSuccess: () => void;
  onBack: () => void;
}

type Method = "upi-qr" | "paypal" | "razorpay" | null;

export function PaymentMethods({
  billingCycle,
  onPaymentSuccess,
  onBack,
}: PaymentMethodsProps) {
  const mounted = useMounted();
  const [plan, setPlan] = useState<PricingPlan | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<Method>(null);
  const [upiQrUrl, setUpiQrUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [copiedPaypal, setCopiedPaypal] = useState(false);
  const [txnId, setTxnId] = useState("");
  const [txnError, setTxnError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (mounted) queueMicrotask(() => setPlan(detectPricing()));
  }, [mounted]);

  // Generate UPI QR code
  useEffect(() => {
    if (!plan || !mounted) return;
    const amount = billingCycle === "yearly" ? plan.yearly : plan.monthly;
    const upiLink = `upi://pay?pa=${encodeURIComponent(
      UPI_CONFIG.upiId
    )}&pn=${encodeURIComponent(UPI_CONFIG.payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(
      UPI_CONFIG.note
    )}`;
    QRCode.toDataURL(upiLink, {
      width: 280, margin: 2,
      color: { dark: "#1e293b", light: "#ffffff" },
    })
      .then((url) => setUpiQrUrl(url))
      .catch(() => {});
  }, [plan, billingCycle, mounted]);

  if (!plan) return null;

  const isIndia = plan.countryCode === "IN";
  // Always show UPI QR first (anyone can use UPI), PayPal for international
  const defaultMethod: Method = isIndia ? "upi-qr" : "paypal";
  const effectiveMethod = selectedMethod ?? defaultMethod;
  const priceDisplay =
    billingCycle === "yearly" ? plan.yearlyDisplay : plan.monthlyDisplay;

  const handlePaypalPayment = () => {
    const amountNum = billingCycle === "yearly" ? plan.yearly : plan.monthly;
    const link = `${PAYPAL_CONFIG.meLink}/${amountNum}`;
    window.open(link, "_blank");
  };

  // After payment, user enters transaction ID → stored as pending verification
  const handleSubmitPayment = () => {
    if (!txnId.trim() || txnId.trim().length < 6) {
      setTxnError(true);
      return;
    }
    setSubmitting(true);
    setTxnError(false);

    // Store payment as PENDING (not immediately premium).
    // In a real app, this would go to server for verification.
    // For now, store in localStorage as pending.
    try {
      const pendingPayments = JSON.parse(
        localStorage.getItem("speaklingo_pending_payments") || "[]"
      );
      pendingPayments.push({
        method: effectiveMethod,
        amount: billingCycle === "yearly" ? plan.yearly : plan.monthly,
        currency: plan.currency,
        txnId: txnId.trim(),
        timestamp: new Date().toISOString(),
        status: "pending",
      });
      localStorage.setItem(
        "speaklingo_pending_payments",
        JSON.stringify(pendingPayments)
      );
    } catch {}

    setTimeout(() => {
      setSubmitting(false);
      setPending(true);
    }, 1000);
  };

  const copyText = async (text: string, type: "upi" | "paypal") => {
    await navigator.clipboard.writeText(text);
    if (type === "upi") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopiedPaypal(true);
      setTimeout(() => setCopiedPaypal(false), 2000);
    }
  };

  // If payment is pending, show pending screen
  if (pending) {
    return (
      <div className="space-y-4">
        <Card className="p-6 bg-gradient-to-br from-amber-50 to-white border-amber-200 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 mx-auto mb-3">
            <Clock className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-stone-800 mb-2">
            Payment Under Verification
          </h3>
          <p className="text-sm text-stone-600 mb-4">
            We&apos;ve received your payment reference:{" "}
            <span className="font-mono font-bold text-stone-800">
              {txnId}
            </span>
          </p>
          <p className="text-xs text-stone-500 mb-4">
            Your premium will be activated within 24 hours after we verify your
            payment. You&apos;ll get an email confirmation once verified.
          </p>
          <div className="bg-amber-50 rounded-lg p-3 text-left mb-4">
            <p className="text-[11px] text-stone-600">
              <strong>What happens next:</strong>
            </p>
            <ol className="text-[11px] text-stone-500 list-decimal list-inside mt-1 space-y-0.5">
              <li>We verify your payment with your bank/UPI/PayPal</li>
              <li>Premium unlocks automatically within 24 hours</li>
              <li>You get full access to all features</li>
            </ol>
          </div>
          <Button onClick={onBack} className="w-full" variant="outline">
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Price summary */}
      <Card className="p-4 bg-gradient-to-br from-emerald-50 to-sky-50 border-emerald-200 text-center">
        <p className="text-xs text-stone-500 mb-1">
          {billingCycle === "yearly" ? "Yearly" : "Monthly"} · {plan.countryName}
        </p>
        <p className="text-3xl font-bold text-stone-800">{priceDisplay}</p>
        {billingCycle === "yearly" && (
          <p className="text-xs text-emerald-700 mt-1">
            {plan.yearlyPerMonth}/month · Save {plan.discount}%
          </p>
        )}
      </Card>

      {/* Payment method selection */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-stone-700">
          Choose Payment Method
        </h3>

        {/* UPI QR — ALWAYS VISIBLE (not just India) */}
        <button
          type="button"
          onClick={() => setSelectedMethod("upi-qr")}
          className={cn(
            "w-full text-left p-3 rounded-lg border-2 transition-all flex items-center gap-3",
            effectiveMethod === "upi-qr"
              ? "border-emerald-500 bg-emerald-50"
              : "border-stone-200 bg-white hover:border-emerald-300"
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600 shrink-0">
            <QrCode className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-stone-800">
                Scan & Pay (UPI QR)
              </span>
              <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                RECOMMENDED
              </span>
            </div>
            <div className="text-[11px] text-stone-500">
              PhonePe, GPay, Paytm, BHIM · 0% fees · Direct to bank
            </div>
          </div>
          {effectiveMethod === "upi-qr" && (
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          )}
        </button>

        {/* PayPal (International) */}
        <button
          type="button"
          onClick={() => setSelectedMethod("paypal")}
          className={cn(
            "w-full text-left p-3 rounded-lg border-2 transition-all flex items-center gap-3",
            effectiveMethod === "paypal"
              ? "border-emerald-500 bg-emerald-50"
              : "border-stone-200 bg-white hover:border-emerald-300"
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-600 shrink-0 text-xs font-bold">
            PP
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-stone-800">PayPal</div>
            <div className="text-[11px] text-stone-500">
              Credit/Debit cards, PayPal balance · Global · ~3% fees
            </div>
          </div>
          {effectiveMethod === "paypal" && (
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          )}
        </button>

        {/* Card / Razorpay (optional) */}
        <button
          type="button"
          onClick={() => setSelectedMethod("razorpay")}
          className={cn(
            "w-full text-left p-3 rounded-lg border-2 transition-all flex items-center gap-3",
            effectiveMethod === "razorpay"
              ? "border-emerald-500 bg-emerald-50"
              : "border-stone-200 bg-white hover:border-emerald-300"
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 shrink-0">
            <CreditCard className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-stone-800">
              Card / Netbanking
            </div>
            <div className="text-[11px] text-stone-500">
              Visa, Mastercard, RuPay · 2% gateway fees
            </div>
          </div>
          {effectiveMethod === "razorpay" && (
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          )}
        </button>
      </div>

      {/* === UPI QR DETAIL === */}
      {effectiveMethod === "upi-qr" && (
        <div className="space-y-3">
          <Card className="p-4 bg-white text-center">
            <div className="flex justify-center mb-3">
              {upiQrUrl ? (
                <img
                  src={upiQrUrl}
                  alt="UPI QR Code"
                  className="w-56 h-56 rounded-lg border border-stone-100"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center">
                  <Loader2 className="h-6 w-4 animate-spin text-stone-400" />
                </div>
              )}
            </div>
            <p className="text-sm font-medium text-stone-700 mb-1">
              Scan with any UPI app
            </p>
            <p className="text-xs text-stone-500 mb-3">
              Amount: <strong>{priceDisplay}</strong> to{" "}
              <strong>{UPI_CONFIG.payeeName}</strong>
            </p>
            <div className="flex items-center justify-center gap-2 mb-3">
              {["PhonePe", "GPay", "Paytm", "BHIM"].map((app) => (
                <Badge key={app} variant="secondary" className="text-[10px] bg-stone-100">
                  {app}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-stone-50 rounded-lg p-2">
              <Smartphone className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              <span className="text-xs font-mono text-stone-600 flex-1 truncate text-left">
                {UPI_CONFIG.upiId}
              </span>
              <button
                type="button"
                onClick={() => copyText(UPI_CONFIG.upiId, "upi")}
                className="text-stone-400 hover:text-emerald-600 shrink-0"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </Card>

          {/* Transaction ID verification — no instant unlock */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-stone-700">
              Step 2: Enter UPI Transaction ID
            </p>
            <p className="text-[11px] text-stone-500">
              After paying, find the Transaction ID (UPI ref no.) in your UPI
              app. Enter it below for verification.
            </p>
            <Input
              placeholder="e.g. 4527XXXXXXXX"
              value={txnId}
              onChange={(e) => {
                setTxnId(e.target.value);
                setTxnError(false);
              }}
              className={cn(
                "text-center font-mono",
                txnError && "border-rose-400 focus-visible:ring-rose-300"
              )}
            />
            {txnError && (
              <p className="text-xs text-rose-600">
                Please enter a valid transaction ID (at least 6 characters)
              </p>
            )}
            <Button
              onClick={handleSubmitPayment}
              disabled={submitting || !txnId.trim()}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Submit Payment for Verification
                </>
              )}
            </Button>
            <p className="text-[10px] text-center text-stone-400">
              Premium activates within 24 hours after verification.
            </p>
          </div>
        </div>
      )}

      {/* === PAYPAL DETAIL === */}
      {effectiveMethod === "paypal" && (
        <div className="space-y-3">
          <Card className="p-4 bg-white text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 text-sky-600 mx-auto mb-3 text-lg font-bold">
              PP
            </div>
            <p className="text-sm font-medium text-stone-700 mb-1">
              Pay with PayPal
            </p>
            <p className="text-xs text-stone-500 mb-3">
              Amount: <strong>{priceDisplay}</strong> to{" "}
              <strong>{PAYPAL_CONFIG.payeeName}</strong>
            </p>
            <div className="flex items-center gap-2 bg-stone-50 rounded-lg p-2 mb-3">
              <DollarSign className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              <span className="text-xs font-mono text-stone-600 flex-1 truncate text-left">
                {PAYPAL_CONFIG.email}
              </span>
              <button
                type="button"
                onClick={() => copyText(PAYPAL_CONFIG.email, "paypal")}
                className="text-stone-400 hover:text-emerald-600 shrink-0"
              >
                {copiedPaypal ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </Card>
          <Button
            onClick={handlePaypalPayment}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white"
            size="lg"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Open PayPal to Pay {priceDisplay}
          </Button>

          {/* Transaction ID verification */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-stone-700">
              After payment, enter PayPal Transaction ID
            </p>
            <Input
              placeholder="e.g. PAYID-XXXXXXXXX"
              value={txnId}
              onChange={(e) => {
                setTxnId(e.target.value);
                setTxnError(false);
              }}
              className={cn(
                "text-center font-mono",
                txnError && "border-rose-400 focus-visible:ring-rose-300"
              )}
            />
            {txnError && (
              <p className="text-xs text-rose-600">
                Please enter a valid transaction ID
              </p>
            )}
            <Button
              onClick={handleSubmitPayment}
              disabled={submitting || !txnId.trim()}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Submit Payment for Verification
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* === RAZORPAY DETAIL === */}
      {effectiveMethod === "razorpay" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <Shield className="h-3.5 w-3.5 text-emerald-500" />
            Secured by Razorpay · 256-bit SSL encryption
          </div>
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2 text-center">
            ⚠️ Razorpay requires KYC verification (₹199). UPI QR or PayPal is
            recommended for now.
          </p>
          <div className="space-y-2">
            <p className="text-xs font-medium text-stone-700">
              After paying via card/netbanking, enter Transaction ID
            </p>
            <Input
              placeholder="e.g. pay_xxxxxxxx"
              value={txnId}
              onChange={(e) => {
                setTxnId(e.target.value);
                setTxnError(false);
              }}
              className={cn(
                "text-center font-mono",
                txnError && "border-rose-400 focus-visible:ring-rose-300"
              )}
            />
            {txnError && (
              <p className="text-xs text-rose-600">
                Please enter a valid transaction ID
              </p>
            )}
            <Button
              onClick={handleSubmitPayment}
              disabled={submitting || !txnId.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Submit Payment for Verification
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Back button */}
      <Button variant="ghost" onClick={onBack} className="w-full text-xs">
        ← Back to plans
      </Button>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-3 text-[10px] text-stone-400 pt-2 border-t border-stone-100">
        <span className="flex items-center gap-0.5">
          <Shield className="h-3 w-3" /> Secure
        </span>
        <span>·</span>
        <span>7-day refund</span>
        <span>·</span>
        <span>Cancel anytime</span>
      </div>
    </div>
  );
}
