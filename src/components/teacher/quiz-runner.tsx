"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, RotateCcw, Trophy, Loader2, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/lib/teacher-config";

interface QuizRunnerProps {
  questions: QuizQuestion[];
  voice?: string;
  ttsSpeed?: number;
  onRestart?: () => void;
}

export function QuizRunner({
  questions,
  voice,
  ttsSpeed,
  onRestart,
}: QuizRunnerProps) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(questions.length).fill(null)
  );
  const [finished, setFinished] = useState(false);
  const [speaking, setSpeaking] = useState<number | null>(null);

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center text-sm text-stone-500 py-6">
        No quiz questions in this lesson.
      </div>
    );
  }

  const q = questions[current];
  const isAnswered = selected !== null;
  const isCorrect = selected === q.answer;

  const score = answers.reduce<number>((acc, ans, i) => {
    if (ans === null) return acc;
    return ans === questions[i].answer ? acc + 1 : acc;
  }, 0);

  const speak = async (text: string, idx: number) => {
    setSpeaking(idx);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice, speed: ttsSpeed }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      await new Audio(url).play();
    } catch {
      // ignore
    } finally {
      setSpeaking(null);
    }
  };

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelected(idx);
    const next = [...answers];
    next[current] = idx;
    setAnswers(next);
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
    } else {
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrent(0);
    setSelected(null);
    setAnswers(Array(questions.length).fill(null));
    setFinished(false);
  };

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <Card className="p-6 text-center bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-3">
          <Trophy className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-stone-800">
          {pct >= 70 ? "Shabash! 🎉" : pct >= 40 ? "Good try! 💪" : "Keep practicing! 📚"}
        </h3>
        <p className="text-sm text-stone-600 mt-1">
          You scored{" "}
          <span className="font-bold text-emerald-700">
            {score}/{questions.length}
          </span>{" "}
          ({pct}%)
        </p>
        <div className="mt-4 space-y-1.5 text-left max-h-48 overflow-y-auto">
          {questions.map((qq, i) => {
            const ok = answers[i] === qq.answer;
            return (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-2 text-xs p-2 rounded",
                  ok ? "bg-emerald-50" : "bg-rose-50"
                )}
              >
                {ok ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                ) : (
                  <X className="h-3.5 w-3.5 text-rose-600 mt-0.5 shrink-0" />
                )}
                <div>
                  <div className="text-stone-700">{qq.question}</div>
                  {!ok && (
                    <div className="text-emerald-700 mt-0.5">
                      Answer: {qq.options[qq.answer]}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <Button onClick={handleRestart} className="mt-4" variant="outline">
          <RotateCcw className="h-4 w-4 mr-1" />
          Try Again
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-stone-500">
          Question {current + 1} of {questions.length}
        </span>
        <span className="text-xs font-medium text-emerald-700">
          Score: {score}
        </span>
      </div>

      <Card className="p-4 bg-white">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-base font-medium text-stone-800">{q.question}</h3>
          <button
            type="button"
            onClick={() => speak(q.question, current)}
            className="shrink-0 text-stone-400 hover:text-emerald-600"
            aria-label="Hear question"
          >
            {speaking === current ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="space-y-2">
          {q.options.map((opt, idx) => {
            const isThis = selected === idx;
            const isRight = idx === q.answer;
            let stateClass =
              "border-stone-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50";
            if (isAnswered) {
              if (isRight) {
                stateClass = "border-emerald-500 bg-emerald-50";
              } else if (isThis) {
                stateClass = "border-rose-500 bg-rose-50";
              } else {
                stateClass = "border-stone-200 bg-white opacity-60";
              }
            }
            return (
              <button
                key={idx}
                type="button"
                disabled={isAnswered}
                onClick={() => handleSelect(idx)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg border-2 transition-all flex items-center gap-2",
                  stateClass,
                  !isAnswered && "cursor-pointer"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0",
                    isAnswered && isRight
                      ? "bg-emerald-500 text-white"
                      : isAnswered && isThis
                      ? "bg-rose-500 text-white"
                      : "bg-stone-100 text-stone-600"
                  )}
                >
                  {isAnswered && isRight ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : isAnswered && isThis ? (
                    <X className="h-3.5 w-3.5" />
                  ) : (
                    String.fromCharCode(65 + idx)
                  )}
                </span>
                <span className="text-sm text-stone-700 flex-1">{opt}</span>
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div
            className={cn(
              "mt-3 p-3 rounded-lg text-sm",
              isCorrect ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
            )}
          >
            <div className="font-semibold mb-0.5">
              {isCorrect ? "Sahi jawab! ✅" : "Almost! 🤏"}
            </div>
            <p className="text-xs">{q.explanation}</p>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleNext}
            disabled={!isAnswered}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {current < questions.length - 1 ? "Next Question" : "See Results"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
