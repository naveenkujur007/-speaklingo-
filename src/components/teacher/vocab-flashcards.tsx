"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Volume2,
  Loader2,
  Star,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { VocabItem } from "@/lib/teacher-config";

interface VocabFlashcardsProps {
  items: VocabItem[];
  voice?: string;
  ttsSpeed?: number;
  onStar?: (item: VocabItem) => Promise<void> | void;
  starredSet?: Set<string>;
}

// Flip-card style flashcards for vocabulary.
// Front: word + pronunciation + part of speech
// Back: meaning + example + translation
export function VocabFlashcards({
  items,
  voice,
  ttsSpeed,
  onStar,
  starredSet,
}: VocabFlashcardsProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [starring, setStarring] = useState(false);

  if (!items || items.length === 0) {
    return (
      <div className="text-center text-sm text-stone-500 py-6">
        No vocabulary in this lesson.
      </div>
    );
  }

  const current = items[index];
  const isStarred = starredSet?.has(current.word) ?? false;

  const playAudio = async (text: string) => {
    setSpeaking(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice, speed: ttsSpeed }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await audio.play();
    } catch {
      // ignore
    } finally {
      setSpeaking(false);
    }
  };

  const goNext = () => {
    setFlipped(false);
    setTimeout(() => setIndex((i) => (i + 1) % items.length), 120);
  };

  const goPrev = () => {
    setFlipped(false);
    setTimeout(() => setIndex((i) => (i - 1 + items.length) % items.length), 120);
  };

  const handleStar = async () => {
    setStarring(true);
    try {
      await onStar?.(current);
    } finally {
      setStarring(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-stone-500">
          Card {index + 1} of {items.length}
        </span>
        <div className="flex gap-1">
          {items.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 w-6 rounded-full transition-colors",
                i === index ? "bg-emerald-500" : "bg-stone-200"
              )}
            />
          ))}
        </div>
      </div>

      <div
        className="relative h-56 cursor-pointer select-none"
        style={{ perspective: "1000px" }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className="absolute inset-0 transition-transform duration-300"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front face */}
          <Card
            className="absolute inset-0 flex flex-col items-center justify-center p-5 bg-gradient-to-br from-emerald-50 to-white border-emerald-200 shadow-sm"
            style={{ backfaceVisibility: "hidden" }}
          >
            <Badge variant="secondary" className="mb-3 capitalize">
              {current.partOfSpeech}
            </Badge>
            <h3 className="text-3xl font-bold text-stone-800 text-center">
              {current.word}
            </h3>
            {current.pronunciation && (
              <p className="mt-2 text-sm text-stone-500 italic">
                /{current.pronunciation}/
              </p>
            )}
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio(current.word);
                }}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
              >
                {speaking ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Volume2 className="h-3 w-3" />
                )}
                Hear
              </button>
              <span className="text-[11px] text-stone-400">
                Tap card to flip
              </span>
            </div>
          </Card>

          {/* Back face */}
          <Card
            className="absolute inset-0 flex flex-col justify-center p-5 bg-white border-stone-200 shadow-sm"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="text-xs text-stone-400 uppercase tracking-wide mb-1">
              Meaning
            </div>
            <p className="text-base font-medium text-stone-800 mb-3">
              {current.meaning}
            </p>
            <div className="text-xs text-stone-400 uppercase tracking-wide mb-1">
              Example
            </div>
            <p className="text-sm text-stone-700 italic mb-1">
              &ldquo;{current.example}&rdquo;
            </p>
            <p className="text-xs text-stone-500">
              {current.exampleTranslation}
            </p>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={goPrev}
          disabled={items.length < 2}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Prev
        </Button>

        <Button
          variant={isStarred ? "default" : "outline"}
          size="sm"
          onClick={handleStar}
          disabled={starring}
          className={cn(
            isStarred
              ? "bg-amber-500 hover:bg-amber-600 text-white"
              : "text-amber-600 border-amber-300"
          )}
        >
          {isStarred ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Saved
            </>
          ) : (
            <>
              <Star className="h-4 w-4 mr-1" />
              Save
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={goNext}
          disabled={items.length < 2}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
