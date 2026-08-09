"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  Square,
  Loader2,
  Volume2,
  Check,
  X,
  RefreshCw,
  Mic2,
  Trophy,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/hooks/use-app-store";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";

interface Sentence {
  text: string;
  level: "easy" | "medium" | "hard";
}

const SAMPLE_SENTENCES: Sentence[] = [
  { text: "Hello, how are you today?", level: "easy" },
  { text: "I would like a cup of coffee, please.", level: "easy" },
  { text: "The weather is beautiful this morning.", level: "easy" },
  { text: "Could you please tell me where the nearest bank is?", level: "medium" },
  { text: "I'm planning to visit my family next weekend.", level: "medium" },
  { text: "She has been working on this project for three months.", level: "medium" },
  { text: "Despite the heavy traffic, we managed to arrive on time.", level: "hard" },
  { text: "The committee unanimously decided to postpone the meeting.", level: "hard" },
  { text: "If I had known earlier, I would have made different arrangements.", level: "hard" },
];

interface PronunciationResult {
  score: number;
  transcript: string;
  matchedWords: string[];
  missedWords: string[];
  extraWords: string[];
  perWord: { word: string; status: "correct" | "missed" | "extra" | "approx" }[];
  feedback: string;
  earnedAchievements?: string[];
}

export function PronunciationSection() {
  const { language, voice, ttsSpeed, triggerRefresh } = useAppStore();
  const [sentences, setSentences] = useState<Sentence[]>(SAMPLE_SENTENCES);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [scoring, setScoring] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const { isRecording, error, level, start, stop, cancel } = useVoiceRecorder();

  const current = sentences[currentIdx];

  useEffect(() => {
    // Shuffle once on mount
    setSentences((prev) => [...prev].sort(() => Math.random() - 0.5));
  }, []);

  const playTarget = async (text: string) => {
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

  const handleMicClick = async () => {
    if (scoring) return;
    if (isRecording) {
      setScoring(true);
      setResult(null);
      const blob = await stop();
      setScoring(false);
      if (!blob) return;
      try {
        const fd = new FormData();
        const ext = blob.type.includes("webm")
          ? "webm"
          : blob.type.includes("ogg")
          ? "ogg"
          : blob.type.includes("mp4")
          ? "mp4"
          : "wav";
        fd.append("audio", blob, `recording.${ext}`);
        fd.append("targetText", current.text);
        fd.append("language", language);
        const res = await fetch("/api/pronunciation", {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) {
          setResult(null);
          return;
        }
        setResult(data);
        if (data.earnedAchievements?.length) {
          triggerRefresh();
        }
      } catch (e) {
        // ignore
      }
    } else {
      await start();
    }
  };

  const nextSentence = () => {
    setResult(null);
    setCurrentIdx((i) => (i + 1) % sentences.length);
  };

  const scoreColor =
    result && result.score >= 75
      ? "text-emerald-600"
      : result && result.score >= 50
      ? "text-amber-600"
      : "text-rose-600";

  return (
    <div className="space-y-4 pb-6">
      <Card className="p-4 bg-gradient-to-br from-sky-500 to-sky-600 text-white border-0 shadow-md">
        <div className="flex items-center gap-2">
          <Mic2 className="h-5 w-5" />
          <div>
            <h1 className="text-lg font-bold">Pronunciation Lab</h1>
            <p className="text-xs text-sky-50">
              Hear the sentence, then say it. AI scores you 0-100.
            </p>
          </div>
        </div>
      </Card>

      {/* Target sentence card */}
      <Card className="p-5 bg-white">
        <div className="flex items-center justify-between mb-3">
          <Badge
            variant="secondary"
            className={cn(
              "capitalize",
              current.level === "easy"
                ? "bg-emerald-100 text-emerald-700"
                : current.level === "medium"
                ? "bg-amber-100 text-amber-700"
                : "bg-rose-100 text-rose-700"
            )}
          >
            {current.level}
          </Badge>
          <span className="text-[11px] text-stone-400">
            Sentence {currentIdx + 1} of {sentences.length}
          </span>
        </div>

        <div className="rounded-lg bg-stone-50 p-4 mb-4">
          <p className="text-lg text-stone-800 text-center font-medium">
            &ldquo;{current.text}&rdquo;
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => playTarget(current.text)}
            disabled={speaking}
          >
            {speaking ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Volume2 className="h-4 w-4 mr-1" />
            )}
            Hear it
          </Button>
        </div>

        {/* Mic button */}
        <div className="flex flex-col items-center py-4">
          <button
            type="button"
            onClick={handleMicClick}
            disabled={scoring}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
            className={cn(
              "relative flex h-20 w-20 items-center justify-center rounded-full transition-all shadow-lg",
              "focus:outline-none focus:ring-4 focus:ring-sky-300/50",
              isRecording
                ? "bg-rose-500 text-white shadow-rose-300/50"
                : "bg-sky-500 text-white hover:bg-sky-600 shadow-sky-300/50",
              scoring && "opacity-70"
            )}
          >
            {isRecording && (
              <>
                <span
                  className="absolute inset-0 rounded-full bg-rose-400/40 animate-ping"
                  style={{ animationDuration: "1.2s" }}
                />
                <span
                  className="absolute rounded-full bg-rose-400/30 transition-all"
                  style={{
                    width: `${80 + level * 50}px`,
                    height: `${80 + level * 50}px`,
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                />
              </>
            )}
            <span className="relative z-10">
              {scoring ? (
                <Loader2 className="h-7 w-7 animate-spin" />
              ) : isRecording ? (
                <Square className="h-6 w-6 fill-current" />
              ) : (
                <Mic className="h-7 w-7" />
              )}
            </span>
          </button>
          <p className="text-sm text-stone-600 mt-3 font-medium">
            {scoring
              ? "Scoring your pronunciation..."
              : isRecording
              ? "Recording... tap to stop"
              : "Tap to speak"}
          </p>
          {isRecording && (
            <button
              type="button"
              onClick={cancel}
              className="text-xs text-stone-500 hover:text-rose-600 underline mt-1"
            >
              cancel
            </button>
          )}
          {error && (
            <p className="text-xs text-rose-600 mt-2">{error}</p>
          )}
        </div>
      </Card>

      {/* Result card */}
      {result && (
        <Card className="p-5 bg-white space-y-4">
          {/* Score */}
          <div className="text-center">
            <div className="text-[11px] uppercase tracking-wide text-stone-400 mb-1">
              Your Score
            </div>
            <div className={cn("text-5xl font-bold", scoreColor)}>
              {result.score}
              <span className="text-2xl text-stone-400">/100</span>
            </div>
            <p className="text-sm text-stone-600 mt-2">{result.feedback}</p>
            {result.earnedAchievements && result.earnedAchievements.length > 0 && (
              <div className="mt-2 inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                <Trophy className="h-3 w-3" />
                New achievement unlocked!
              </div>
            )}
          </div>

          {/* Word-by-word feedback */}
          <div>
            <div className="text-[11px] uppercase tracking-wide text-stone-400 mb-2">
              Word-by-word
            </div>
            <div className="flex flex-wrap gap-1.5">
              {result.perWord.map((w, i) => {
                const colors: Record<string, string> = {
                  correct: "bg-emerald-100 text-emerald-700 border-emerald-200",
                  approx: "bg-amber-100 text-amber-700 border-amber-200",
                  missed: "bg-rose-100 text-rose-700 border-rose-200 line-through",
                  extra: "bg-stone-100 text-stone-500 border-stone-200 opacity-60",
                };
                return (
                  <span
                    key={i}
                    className={cn(
                      "inline-flex items-center gap-1 text-xs px-2 py-1 rounded border",
                      colors[w.status]
                    )}
                  >
                    {w.status === "correct" && <Check className="h-3 w-3" />}
                    {w.status === "missed" && <X className="h-3 w-3" />}
                    {w.status === "extra" && <span className="text-[9px]">+</span>}
                    {w.word}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Transcript */}
          <div>
            <div className="text-[11px] uppercase tracking-wide text-stone-400 mb-1">
              What we heard
            </div>
            <p className="text-sm text-stone-700 italic bg-stone-50 rounded p-2">
              &ldquo;{result.transcript}&rdquo;
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => playTarget(current.text)}
            >
              <Volume2 className="h-4 w-4 mr-1" />
              Try Again
            </Button>
            <Button
              className="flex-1 bg-sky-500 hover:bg-sky-600 text-white"
              onClick={nextSentence}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Next Sentence
            </Button>
          </div>
        </Card>
      )}

      {!result && !isRecording && !scoring && (
        <Card className="p-4 bg-sky-50/50 border-sky-200">
          <div className="flex items-start gap-2 text-sm text-stone-700">
            <Sparkles className="h-4 w-4 text-sky-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium mb-1">How it works:</p>
              <ol className="text-xs text-stone-600 space-y-1 list-decimal list-inside">
                <li>Tap "Hear it" to listen to the target sentence.</li>
                <li>Tap the mic and say the sentence aloud.</li>
                <li>Tap again to stop — AI scores your pronunciation 0-100.</li>
                <li>Review word-by-word feedback (green = correct, red = missed).</li>
              </ol>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
