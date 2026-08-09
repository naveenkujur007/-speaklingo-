"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Volume2,
  RotateCcw,
  Check,
  Sparkles,
  Brain,
  Clock,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/hooks/use-app-store";

interface DueCard {
  id: string;
  ease: number;
  interval: number;
  repetitions: number;
  dueAt: string;
  learnedItem: {
    id: string;
    type: string;
    item: string;
    meaning: string;
    example: string | null;
  };
}

interface ReviewState {
  due: DueCard[];
  dueCount: number;
  totalCards: number;
  nextDueAt: string | null;
}

type Quality = "again" | "hard" | "good" | "easy";

const QUALITY_BUTTONS: {
  q: Quality;
  label: string;
  hint: string;
  color: string;
}[] = [
  { q: "again", label: "Again", hint: "< 10 min", color: "bg-rose-500 hover:bg-rose-600 text-white" },
  { q: "hard", label: "Hard", hint: "tomorrow", color: "bg-amber-500 hover:bg-amber-600 text-white" },
  { q: "good", label: "Good", hint: "3 days", color: "bg-emerald-500 hover:bg-emerald-600 text-white" },
  { q: "easy", label: "Easy", hint: "7 days", color: "bg-sky-500 hover:bg-sky-600 text-white" },
];

export function ReviewSection() {
  const { language, refreshTick, triggerRefresh, voice, ttsSpeed } = useAppStore();
  const [state, setState] = useState<ReviewState | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  const fetchReviews = useCallback(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
    fetch(`/api/review?language=${language}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setState(d);
        setRevealed(false);
        if (d.dueCount === 0) {
          setSessionDone(true);
        } else {
          setSessionDone(false);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [language, refreshTick]);

  useEffect(() => fetchReviews(), [fetchReviews]);

  const current = state?.due[0];

  const speak = async (text: string) => {
    setSpeaking(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice, speed: ttsSpeed }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      await new Audio(URL.createObjectURL(blob)).play();
    } catch {
      // ignore
    } finally {
      setSpeaking(false);
    }
  };

  const rateCard = async (quality: Quality) => {
    if (!current) return;
    await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        learnedItemId: current.learnedItem.id,
        quality,
      }),
    });
    setReviewedCount((c) => c + 1);
    setRevealed(false);
    triggerRefresh();
    // Re-fetch the queue
    fetchReviews();
  };

  if (loading && !state) {
    return (
      <div className="flex items-center justify-center py-12 text-stone-500">
        <Loader2 className="h-5 w-4 animate-spin mr-2" />
        Loading review queue...
      </div>
    );
  }

  if (!state) return null;

  // Session complete state
  if (sessionDone || !current) {
    return (
      <div className="space-y-4 pb-6">
        <Card className="p-6 text-center bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-3">
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-stone-800">
            {reviewedCount > 0
              ? `All caught up! 🎉 (${reviewedCount} cards reviewed)`
              : "Nothing due right now! 🎉"}
          </h2>
          <p className="text-sm text-stone-600 mt-1 mb-4">
            {state.totalCards > 0
              ? `You have ${state.totalCards} cards in your review bank. Come back when more cards are due.`
              : "Save words from lessons or chats and they'll appear here for spaced-repetition review."}
          </p>
          {state.nextDueAt && (
            <p className="text-xs text-stone-500 flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" />
              Next card due: {new Date(state.nextDueAt).toLocaleString()}
            </p>
          )}
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => fetchReviews()}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </Card>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3 text-center bg-white">
            <div className="text-xl font-bold text-emerald-600">
              {state.totalCards}
            </div>
            <div className="text-[11px] text-stone-500">Total cards</div>
          </Card>
          <Card className="p-3 text-center bg-white">
            <div className="text-xl font-bold text-amber-600">
              {reviewedCount}
            </div>
            <div className="text-[11px] text-stone-500">Reviewed today</div>
          </Card>
          <Card className="p-3 text-center bg-white">
            <div className="text-xl font-bold text-sky-600">{state.dueCount}</div>
            <div className="text-[11px] text-stone-500">Due now</div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <Card className="p-4 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-stone-800 flex items-center gap-1.5">
              <Brain className="h-5 w-5 text-violet-500" />
              Review Session
            </h1>
            <p className="text-xs text-stone-500">
              Spaced repetition · {reviewedCount} reviewed · {state.dueCount} remaining
            </p>
          </div>
          <Badge variant="secondary">
            {state.dueCount} due
          </Badge>
        </div>
      </Card>

      {/* The card */}
      <Card className="p-5 bg-white">
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline" className="capitalize">
            {current.learnedItem.type}
          </Badge>
          <div className="flex items-center gap-2 text-[11px] text-stone-400">
            <span>Reps: {current.repetitions}</span>
            <span>·</span>
            <span>Ease: {current.ease.toFixed(1)}</span>
          </div>
        </div>

        {!revealed ? (
          // Question side
          <div className="text-center py-8">
            <div className="text-[11px] uppercase tracking-wide text-stone-400 mb-2">
              What does this mean?
            </div>
            <h2 className="text-3xl font-bold text-stone-800 mb-3">
              {current.learnedItem.item}
            </h2>
            <button
              type="button"
              onClick={() => speak(current.learnedItem.item)}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-violet-500 text-white hover:bg-violet-600"
            >
              {speaking ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Volume2 className="h-3 w-3" />
              )}
              Hear
            </button>
            <div className="mt-6">
              <Button
                onClick={() => setRevealed(true)}
                className="bg-violet-500 hover:bg-violet-600 text-white"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Show Answer
              </Button>
            </div>
          </div>
        ) : (
          // Answer side
          <div className="space-y-3">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-stone-400 mb-1">
                Word
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-stone-800">
                  {current.learnedItem.item}
                </h3>
                <button
                  type="button"
                  onClick={() => speak(current.learnedItem.item)}
                  className="text-stone-400 hover:text-violet-600"
                >
                  {speaking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-stone-400 mb-1">
                Meaning
              </div>
              <p className="text-sm text-stone-700">
                {current.learnedItem.meaning}
              </p>
            </div>
            {current.learnedItem.example && (
              <div>
                <div className="text-[11px] uppercase tracking-wide text-stone-400 mb-1">
                  Example
                </div>
                <p className="text-sm text-stone-600 italic">
                  &ldquo;{current.learnedItem.example}&rdquo;
                </p>
              </div>
            )}

            {/* Quality buttons */}
            <div className="grid grid-cols-4 gap-2 pt-2">
              {QUALITY_BUTTONS.map((b) => (
                <button
                  key={b.q}
                  type="button"
                  onClick={() => rateCard(b.q)}
                  className={cn(
                    "flex flex-col items-center py-2 px-1 rounded-lg transition-colors",
                    b.color
                  )}
                >
                  <span className="text-sm font-semibold">{b.label}</span>
                  <span className="text-[10px] opacity-80">{b.hint}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      <p className="text-xs text-stone-400 text-center">
        💡 Rate how hard it was. Harder cards come back sooner, easy ones later.
      </p>
    </div>
  );
}
