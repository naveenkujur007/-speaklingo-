"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  Sparkles,
  Eraser,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/hooks/use-app-store";
import { useToast } from "@/hooks/use-toast";
import { MessageBubble } from "@/components/teacher/message-bubble";
import { VoiceButton } from "@/components/teacher/voice-button";
import { Textarea } from "@/components/ui/textarea";
import type { ChatMessageVM } from "@/hooks/use-chat-store";

interface Scenario {
  code: string;
  title: string;
  description: string;
  emoji: string;
  language: string;
  persona: string;
  situation: string;
  openingLine: string;
  difficulty: string;
}

let idCounter = 0;
const nextId = () => `rp_${Date.now()}_${idCounter++}`;

export function RolePlaySection() {
  const { language, voice, ttsSpeed, autoSpeak, triggerRefresh } = useAppStore();
  const { toast } = useToast();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<ChatMessageVM[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
    fetch(`/api/roleplay?language=${language}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setScenarios(d.scenarios ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [language]);

  const startScenario = (sc: Scenario) => {
    setActive(sc);
    setMessages([
      {
        id: nextId(),
        role: "assistant",
        content: sc.openingLine,
        createdAt: Date.now(),
      },
    ]);
    setDraft("");
  };

  const sendMessage = async (text: string) => {
    if (!active) return;
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setMessages((m) => [
      ...m,
      { id: nextId(), role: "user", content: trimmed, createdAt: Date.now() },
      { id: nextId(), role: "assistant", content: "", createdAt: Date.now(), isLoading: true },
    ]);
    setSending(true);
    setDraft("");

    const history = messages
      .filter((m) => !m.isLoading)
      .map((m) => ({ role: m.role, content: m.content }))
      .slice(-8);

    try {
      const res = await fetch("/api/roleplay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioCode: active.code,
          message: trimmed,
          history,
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed.");
      setMessages((m) =>
        m.map((msg, i) =>
          i === m.length - 1
            ? {
                ...msg,
                content: data.reply,
                corrections: data.corrections || [],
                isLoading: false,
              }
            : msg
        )
      );
      triggerRefresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error.";
      setMessages((m) =>
        m.map((msg, i) =>
          i === m.length - 1 ? { ...msg, error: msg, isLoading: false } : msg
        )
      );
      toast({
        title: "Role-play error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (draft.trim()) sendMessage(draft);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-stone-500">
        <Loader2 className="h-5 w-4 animate-spin mr-2" />
        Loading scenarios...
      </div>
    );
  }

  // Active role-play chat view
  if (active) {
    return (
      <div className="space-y-4 pb-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => { setActive(null); setMessages([]); }}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            All scenarios
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setMessages([
                {
                  id: nextId(),
                  role: "assistant",
                  content: active.openingLine,
                  createdAt: Date.now(),
                },
              ]);
            }}
          >
            <Eraser className="h-4 w-4 mr-1" />
            Restart
          </Button>
        </div>

        <Card className="p-4 bg-gradient-to-br from-fuchsia-50 to-white border-fuchsia-200">
          <div className="flex items-start gap-3">
            <div className="text-3xl">{active.emoji}</div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-stone-800">
                {active.title}
              </h2>
              <p className="text-xs text-stone-600 mt-0.5">
                You are talking to: <strong>{active.persona}</strong>
              </p>
              <p className="text-xs text-stone-500 mt-1">
                🎬 {active.situation}
              </p>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              role={m.role}
              content={m.content}
              corrections={m.corrections}
              isLoading={m.isLoading}
              error={m.error}
              autoSpeak={autoSpeak}
              voice={voice}
              ttsSpeed={ttsSpeed}
            />
          ))}
        </div>

        <div className="flex items-end gap-3">
          <div className="shrink-0">
            <VoiceButton
              disabled={sending}
              onTranscribed={(t) => sendMessage(t)}
              onError={(msg) =>
                toast({
                  title: "Voice issue",
                  description: msg,
                  variant: "destructive",
                })
              }
            />
          </div>
          <div className="flex-1">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Reply to the ${active.persona}...`}
              rows={2}
              className="resize-none bg-stone-50 border-stone-200 focus-visible:ring-fuchsia-300"
              disabled={sending}
            />
            <div className="flex justify-end mt-1.5">
              <Button
                size="sm"
                onClick={() => draft.trim() && sendMessage(draft)}
                disabled={!draft.trim() || sending}
                className="bg-fuchsia-500 hover:bg-fuchsia-600 text-white"
              >
                <Send className="h-3.5 w-3.5 mr-1" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Scenario picker
  return (
    <div className="space-y-4 pb-6">
      <Card className="p-4 bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 text-white border-0 shadow-md">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <div>
            <h1 className="text-lg font-bold">Role-Play Scenarios</h1>
            <p className="text-xs text-fuchsia-50">
              Practice real-life conversations. AI stays in character.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {scenarios.map((sc) => (
          <Card
            key={sc.code}
            className="p-4 bg-white hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => startScenario(sc)}
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl">{sc.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-stone-800">
                    {sc.title}
                  </h3>
                </div>
                <p className="text-xs text-stone-600">{sc.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] capitalize",
                      sc.difficulty === "beginner"
                        ? "bg-emerald-100 text-emerald-700"
                        : sc.difficulty === "intermediate"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-rose-100 text-rose-700"
                    )}
                  >
                    {sc.difficulty}
                  </Badge>
                  <span className="text-[10px] text-stone-400">
                    AI plays: {sc.persona}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {scenarios.length === 0 && (
        <Card className="p-6 text-center text-stone-500">
          <p className="text-sm">
            No role-play scenarios available for this language yet. Try English!
          </p>
        </Card>
      )}
    </div>
  );
}
