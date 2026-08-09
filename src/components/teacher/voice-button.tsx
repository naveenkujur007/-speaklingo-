"use client";

import { Mic, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { useEffect, useState } from "react";

interface VoiceButtonProps {
  disabled?: boolean;
  onTranscribed: (text: string) => void;
  onError?: (msg: string) => void;
}

// Big push-to-talk button. Records audio while pressed / toggled,
// then sends it to /api/asr and emits the transcribed text.
export function VoiceButton({ disabled, onTranscribed, onError }: VoiceButtonProps) {
  const { isRecording, error, level, start, stop, cancel } = useVoiceRecorder();
  const [transcribing, setTranscribing] = useState(false);

  useEffect(() => {
    if (error && onError) onError(error);
  }, [error, onError]);

  const handleClick = async () => {
    if (disabled) return;
    if (transcribing) return;
    if (isRecording) {
      setTranscribing(true);
      const blob = await stop();
      setTranscribing(false);
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
        const res = await fetch("/api/asr", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          onError?.(data.error || "Transcription failed.");
          return;
        }
        if (data.text && typeof data.text === "string") {
          onTranscribed(data.text.trim());
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Network error during transcription.";
        onError?.(msg);
      }
    } else {
      await start();
    }
  };

  const handleCancel = () => {
    cancel();
  };

  const isActive = isRecording || transcribing;

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || transcribing}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
        className={cn(
          "relative flex h-14 w-14 items-center justify-center rounded-full transition-all",
          "shadow-lg focus:outline-none focus:ring-4 focus:ring-emerald-300/50",
          isActive
            ? "bg-rose-500 text-white shadow-rose-300/50"
            : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-300/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {/* Pulse rings while recording */}
        {isRecording && (
          <>
            <span
              className="absolute inset-0 rounded-full bg-rose-400/40 animate-ping"
              style={{ animationDuration: "1.2s" }}
            />
            <span
              className="absolute rounded-full bg-rose-400/30 transition-all"
              style={{
                width: `${56 + level * 40}px`,
                height: `${56 + level * 40}px`,
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          </>
        )}
        <span className="relative z-10">
          {transcribing ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : isRecording ? (
            <Square className="h-5 w-5 fill-current" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </span>
      </button>

      <div className="flex flex-col">
        <span className="text-sm font-medium text-stone-800">
          {transcribing
            ? "Transcribing..."
            : isRecording
            ? "Recording... tap to stop"
            : "Tap to speak"}
        </span>
        {isRecording && (
          <button
            type="button"
            onClick={handleCancel}
            className="text-xs text-stone-500 hover:text-rose-600 underline-offset-2 hover:underline w-fit"
          >
            cancel
          </button>
        )}
      </div>
    </div>
  );
}
