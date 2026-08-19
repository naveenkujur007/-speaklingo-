"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChatStore } from "@/hooks/use-chat-store";
import { useAppStore } from "@/hooks/use-app-store";
import { useToast } from "@/hooks/use-toast";
import { MessageBubble } from "@/components/teacher/message-bubble";
import { VoiceButton } from "@/components/teacher/voice-button";
import { RobotTeacherAvatar, type AvatarState } from "@/components/teacher/robot-teacher-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Eraser, Sparkles } from "lucide-react";
import { LANGUAGES, type CorrectionItem } from "@/lib/teacher-config";
import { speakText } from "@/lib/speak";

interface PracticeSectionProps {
  onStatsRefresh?: () => void;
}

export function PracticeSection({ onStatsRefresh }: PracticeSectionProps) {
  const app = useAppStore();
  const store = useChatStore();
  const { toast } = useToast();
  const [draft, setDraft] = useState("");
  const [avatarState, setAvatarState] = useState<AvatarState>("idle");
  const [avatarSpeech, setAvatarSpeech] = useState<string>("");
  const [avatarSpeaking, setAvatarSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastProcessedIdRef = useRef<string | null>(null);

  const hasMessages = store.messages.length > 0;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [store.messages]);

  // Watch messages for AI reply finalization → drive avatar speech.
  useEffect(() => {
    const msgs = store.messages;
    if (msgs.length === 0) return;
    const last = msgs[msgs.length - 1];

    if (last.id === lastProcessedIdRef.current || last.isLoading || last.role !== "assistant" || !last.content) {
      return;
    }

    lastProcessedIdRef.current = last.id;

    if (!app.autoSpeak) {
      setAvatarState("idle");
      setAvatarSpeech("");
      return;
    }

    const corrections = last.corrections ?? [];
    let cancelled = false;

    const runSequence = async () => {
      // 1. Speak the reply
      setAvatarState("speaking");
      setAvatarSpeech(last.content);
      setAvatarSpeaking(true);
      await speakText(last.content);
      if (cancelled) return;
      setAvatarSpeaking(false);

      // 2. Speak each correction verbally
      for (const c of corrections) {
        if (cancelled) return;
        setAvatarState("correcting");
        const correctionText = buildCorrectionSpeech(c);
        setAvatarSpeech(correctionText);
        setAvatarSpeaking(true);
        await speakText(correctionText);
        if (cancelled) return;
        setAvatarSpeaking(false);
        await new Promise((r) => setTimeout(r, 400));
      }

      // 3. Final state
      if (cancelled) return;
      if (corrections.length > 0) {
        setAvatarState("happy");
        setAvatarSpeech("Keep practicing! You're improving. 💪");
        await new Promise((r) => setTimeout(r, 2000));
      }
      if (cancelled) return;
      setAvatarState("idle");
      setAvatarSpeech("");
    };

    runSequence();

    return () => { cancelled = true; };
  }, [store.messages, app.autoSpeak]);

  // When sending starts, set avatar to thinking.
  useEffect(() => {
    if (store.isSending) {
      setAvatarState("thinking");
      setAvatarSpeech("");
    }
  }, [store.isSending]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || store.isSending) return;

      setAvatarState("listening");
      setAvatarSpeech("");

      store.pushUserMessage(trimmed);
      const placeholderId = store.pushAssistantPlaceholder();
      store.setIsSending(true);

      const history = useChatStore
        .getState()
        .messages.filter((m) => m.id !== placeholderId && !m.isLoading)
        .map((m) => ({ role: m.role, content: m.content }))
        .slice(-8);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: store.sessionId,
            message: trimmed,
            history,
            language: app.language,
            level: app.level,
            topic: app.topic,
            hintLanguage: app.hintLanguage,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed.");
        if (data.sessionId) store.setSessionId(data.sessionId);
        store.finalizeAssistant(placeholderId, data.reply, data.corrections || []);
        app.triggerRefresh();
        onStatsRefresh?.();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Network error.";
        store.markError(placeholderId, msg);
        setAvatarState("idle");
        toast({ title: "Couldn't reach SpeakLingo", description: msg, variant: "destructive" });
      } finally {
        store.setIsSending(false);
      }
    },
    [store, app, toast, onStatsRefresh]
  );

  const handleSend = () => {
    if (!draft.trim()) return;
    sendMessage(draft);
    setDraft("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    store.reset();
    setDraft("");
    setAvatarState("idle");
    setAvatarSpeech("");
    lastProcessedIdRef.current = null;
    toast({ title: "Chat cleared", description: "Started fresh." });
  };

  const currentLanguage = LANGUAGES.find((l) => l.code === app.language);

  return (
    <div className="flex flex-col rounded-xl bg-white border border-stone-200 shadow-sm overflow-hidden h-full min-h-[70vh] lg:min-h-[calc(100vh-180px)]">
      {/* Avatar header */}
      <div className="bg-gradient-to-b from-emerald-50 to-white border-b border-stone-200 p-4">
        <RobotTeacherAvatar
          state={avatarState}
          speechText={avatarSpeech}
          isSpeaking={avatarSpeaking}
          size="md"
        />
      </div>

      {/* Chat scroll area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center text-center py-8 px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-3">
              <Sparkles className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-semibold text-stone-800 mb-1">
              Let&apos;s practice {currentLanguage?.name ?? "English"}!
            </h2>
            <p className="text-sm text-stone-500 max-w-md">
              Tap the mic and start speaking, or type below. The AI teacher will
              reply with voice, catch your mistakes, and explain them out loud.
            </p>
          </div>
        )}

        {store.messages.map((m) => (
          <MessageBubble
            key={m.id}
            role={m.role}
            content={m.content}
            corrections={m.corrections}
            isLoading={m.isLoading}
            error={m.error}
            autoSpeak={false}
          />
        ))}
      </div>

      {/* Composer */}
      <div className="border-t border-stone-200 bg-white p-3 sm:p-4">
        <div className="flex items-end gap-3">
          <div className="shrink-0">
            <VoiceButton
              disabled={store.isSending}
              onTranscribed={(t) => sendMessage(t)}
              onError={(msg) =>
                toast({ title: "Voice input issue", description: msg, variant: "destructive" })
              }
            />
          </div>
          <div className="flex-1 min-w-0">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Type in ${currentLanguage?.name ?? "English"}, or tap the mic and speak...`}
              rows={2}
              className="resize-none bg-stone-50 border-stone-200 focus-visible:ring-emerald-300"
              disabled={store.isSending}
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[11px] text-stone-400">
                <kbd className="px-1 py-0.5 bg-stone-100 rounded border border-stone-200 text-[10px]">Enter</kbd>{" "}
                send ·{" "}
                <kbd className="px-1 py-0.5 bg-stone-100 rounded border border-stone-200 text-[10px]">Shift+Enter</kbd>{" "}
                newline
              </p>
              <div className="flex items-center gap-1">
                {hasMessages && (
                  <Button variant="ghost" size="sm" onClick={handleClearChat} className="text-stone-500 hover:text-rose-600">
                    <Eraser className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={!draft.trim() || store.isSending}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  <Send className="h-3.5 w-3.5 mr-1" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildCorrectionSpeech(c: CorrectionItem): string {
  return `Wait! You said "${c.original}", but it should be "${c.corrected}". ${c.explanation}`;
}
