"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Check, Crown, Globe, Lock, KeyRound, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  detectPricing, FREE_LESSON_LIMIT, type PricingPlan,
} from "@/lib/pricing";
import {
  tryUnlockOwner, setPaidSubscriber,
} from "@/lib/owner-mode";
import { useMounted } from "@/hooks/use-mounted";
import { PaymentMethods } from "@/components/teacher/payment-methods";

interface PaywallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonsCompleted: number;
  onUnlock?: () => void;
}

export function PaywallDialog({
  open,
  onOpenChange,
  lessonsCompleted,
  onUnlock,
}: PaywallDialogProps) {
  const mounted = useMounted();
  const [plan, setPlan] = useState<PricingPlan | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [showOwnerInput, setShowOwnerInput] = useState(false);
  const [ownerCode, setOwnerCode] = useState("");
  const [ownerError, setOwnerError] = useState(false);
  const [view, setView] = useState<"plans" | "payment">("plans");

  useEffect(() => {
    if (open && mounted) {
      queueMicrotask(() => {
        setPlan(detectPricing());
        setView("plans");
      });
    }
  }, [open, mounted]);

  const handleSubscribe = () => setView("payment");

  const handlePaymentSuccess = () => {
    setPaidSubscriber(true);
    onUnlock?.();
    onOpenChange(false);
    setView("plans");
  };

  const handleOwnerUnlock = () => {
    if (tryUnlockOwner(ownerCode)) {
      setOwnerError(false);
      setOwnerCode("");
      setShowOwnerInput(false);
      onUnlock?.();
      onOpenChange(false);
    } else {
      setOwnerError(true);
    }
  };

  if (!plan) return null;

  const price = billingCycle === "monthly" ? plan.monthlyDisplay : plan.yearlyDisplay;
  const perMonth = billingCycle === "yearly" ? plan.yearlyPerMonth : plan.monthlyDisplay;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        {view === "payment" ? (
          <div>
            <DialogHeader>
              <DialogTitle className="text-center text-lg mb-2">
                Complete Payment
              </DialogTitle>
            </DialogHeader>
            <PaymentMethods
              billingCycle={billingCycle}
              onPaymentSuccess={handlePaymentSuccess}
              onBack={() => setView("plans")}
            />
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center justify-center mb-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 text-white shadow-lg">
                  <Crown className="h-7 w-7" />
                </div>
              </div>
              <DialogTitle className="text-center text-xl">
                Unlock VoxAI Premium
              </DialogTitle>
              <DialogDescription className="text-center">
                You&apos;ve used {lessonsCompleted} of {FREE_LESSON_LIMIT} free lessons.
                Upgrade for unlimited access.
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-center gap-1.5 text-xs text-stone-500 bg-stone-50 rounded-lg py-2">
              <Globe className="h-3.5 w-3.5" />
              Detected region:{" "}
              <span className="font-medium text-stone-700">{plan.countryName}</span>
              {plan.tier !== "high" && (
                <Badge variant="secondary" className="text-[10px] ml-1">
                  Regional pricing
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1 bg-stone-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={cn(
                  "py-1.5 px-2 rounded-md text-sm font-medium transition-colors",
                  billingCycle === "monthly"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-stone-500"
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={cn(
                  "py-1.5 px-2 rounded-md text-sm font-medium transition-colors relative",
                  billingCycle === "yearly"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-stone-500"
                )}
              >
                Yearly
                <span className="absolute -top-2 -right-1 text-[9px] bg-emerald-500 text-white px-1 py-0.5 rounded-full">
                  -{plan.discount}%
                </span>
              </button>
            </div>

            <Card className="p-5 bg-gradient-to-br from-emerald-50 to-sky-50 border-emerald-200 text-center">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-stone-800">{price}</span>
                <span className="text-sm text-stone-500">
                  /{billingCycle === "monthly" ? "month" : "year"}
                </span>
              </div>
              {billingCycle === "yearly" && (
                <p className="text-xs text-emerald-700 mt-1">
                  Just {perMonth}/month, billed annually
                </p>
              )}
            </Card>

            <div className="space-y-2">
              {[
                "Unlimited lessons (A1 → C2)",
                "All 8 languages",
                "Voice chat with AI teacher",
                "Pronunciation scoring lab",
                "Role-play scenarios",
                "Spaced repetition review",
                "Offline lesson access",
                "No ads, ever",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Check className="h-3 w-3" />
                  </div>
                  <span className="text-stone-700">{feature}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={handleSubscribe}
              className="w-full bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 text-white"
              size="lg"
            >
              <Zap className="h-4 w-4 mr-1" />
              Continue to Payment
            </Button>

            <p className="text-[10px] text-center text-stone-400">
              💳 UPI · PayPal · Cards · Cancel anytime · 7-day refund
            </p>

            <div className="pt-2 border-t border-stone-100">
              {!showOwnerInput ? (
                <button
                  type="button"
                  onClick={() => setShowOwnerInput(true)}
                  className="text-[10px] text-stone-400 hover:text-stone-600 flex items-center gap-1 mx-auto"
                >
                  <KeyRound className="h-3 w-3" />
                  Have an access code?
                </button>
              ) : (
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Enter access code"
                    value={ownerCode}
                    onChange={(e) => {
                      setOwnerCode(e.target.value);
                      setOwnerError(false);
                    }}
                    className={cn(
                      "text-center",
                      ownerError && "border-rose-400 focus-visible:ring-rose-300"
                    )}
                  />
                  {ownerError && (
                    <p className="text-xs text-rose-600 text-center">
                      Invalid access code
                    </p>
                  )}
                  <Button
                    onClick={handleOwnerUnlock}
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    <Lock className="h-3.5 w-3.5 mr-1" />
                    Unlock
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
