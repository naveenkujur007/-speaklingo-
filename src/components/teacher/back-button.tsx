"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

// Reusable back button — goes to Home section.
export function BackToHome({ onBack }: { onBack: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onBack}
      className="mb-2 text-stone-500 hover:text-emerald-600"
    >
      <ArrowLeft className="h-4 w-4 mr-1" />
      Back
    </Button>
  );
}
