"use client";

import { Volume2, Loader2, AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { CorrectionItem } from "@/lib/teacher-config";
import { speakText } from "@/lib/speak";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  corrections?: CorrectionItem[];
  isLoading?: boolean;
  error?: string;
  autoSpeak?: boolean;
  // Legacy props — speakText reads from the global app store now.
  voice?: string;
  ttsSpeed?: number;
  onSpeak?: (audio: HTMLAudioElement) => void;
}

export function MessageBubble({
  role,
  content,
  corrections,
  isLoading,
  error,
  autoSpeak,
  onSpeak,
}: MessageBubbleProps) {
  const isUser = role === "user";
  const [speaking, setSpeaking] = useState(false);
  const spokeRef = useRef(false);

  // Auto-speak assistant replies once when they finalize.
  // Uses speakText() which reads the global app store for engine/voice
  // settings — native (Google/Microsoft) by default, falls back to cloud AI.
  useEffect(() => {
    if (isUser || !autoSpeak || !content || isLoading || spokeRef.current) {
      return;
    }
    spokeRef.current = true;
    let active = true;
    queueMicrotask(() => {
      if (active) setSpeaking(true);
    });
    speakText(content).finally(() => {
      if (active) setSpeaking(false);
    });
    return () => {
      active = false;
    };
  }, [isUser, content, isLoading, autoSpeak]);

  const handlePlay = async () => {
    if (!content) return;
    setSpeaking(true);
    await speakText(content);
    setSpeaking(false);
    void onSpeak;
  };

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-sm border",
          isUser
            ? "bg-emerald-500 text-white border-emerald-500 rounded-br-sm"
            : "bg-white text-stone-800 border-stone-200 rounded-bl-sm"
        )}
      >
        {isLoading ? (
          <div className="flex items-center gap-2 text-stone-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">SpeakLingo is thinking...</span>
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 text-rose-600">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        ) : (
          <>
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
              {content}
            </p>

            <div className="mt-2 flex items-center gap-2">
              {!isUser && (
                <button
                  type="button"
                  onClick={handlePlay}
                  disabled={speaking}
                  className={cn(
                    "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors",
                    isUser
                      ? "text-white/80 hover:bg-white/10"
                      : "text-stone-500 hover:bg-stone-100"
                  )}
                >
                  {speaking ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Volume2 className="h-3 w-3" />
                  )}
                  {speaking ? "Speaking" : "Play"}
                </button>
              )}
            </div>

            {/* Corrections block */}
            {!isUser && corrections && corrections.length > 0 && (
              <div className="mt-3 border-t border-stone-200 pt-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Corrections ({corrections.length})
                </div>
                {corrections.map((c, i) => (
                  <CorrectionCard key={i} item={c} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CorrectionCard({ item }: { item: CorrectionItem }) {
  const typeColor: Record<string, string> = {
    grammar: "bg-rose-100 text-rose-700",
    spelling: "bg-amber-100 text-amber-700",
    vocabulary: "bg-violet-100 text-violet-700",
    pronunciation: "bg-sky-100 text-sky-700",
    "word-order": "bg-fuchsia-100 text-fuchsia-700",
    punctuation: "bg-slate-100 text-slate-700",
  };
  return (
    <div className="rounded-lg bg-amber-50/60 border border-amber-200 p-2.5 text-xs">
      <div className="flex flex-wrap items-center gap-1.5 mb-1">
        <span
          className={cn(
            "inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide",
            typeColor[item.type] ?? "bg-stone-100 text-stone-700"
          )}
        >
          {item.type}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="line-through text-rose-600">{item.original}</span>
        <span className="text-stone-400">&rarr;</span>
        <span className="font-semibold text-emerald-700">{item.corrected}</span>
      </div>
      <p className="mt-1 text-stone-600">{item.explanation}</p>
    </div>
  );
}
