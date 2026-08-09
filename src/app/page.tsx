"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChatStore } from "@/hooks/use-chat-store";
import { useToast } from "@/hooks/use-toast";
import { MessageBubble } from "@/components/teacher/message-bubble";
import { VoiceButton } from "@/components/teacher/voice-button";
import { SettingsPanel } from "@/components/teacher/settings-panel";
import { ProgressDashboard } from "@/components/teacher/progress-dashboard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Sparkles,
  Send,
  Trash2,
  Menu,
  Bot,
  GraduationCap,
  BarChart3,
  Eraser,
} from "lucide-react";
import { LANGUAGES } from "@/lib/teacher-config";

export default function Home() {
  const store = useChatStore();
  const { toast } = useToast();
  const [draft, setDraft] = useState("");
  const [statsRefresh, setStatsRefresh] = useState(0);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [store.messages]);

  const triggerStatsRefresh = useCallback(() => {
    setStatsRefresh((n) => n + 1);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || store.isSending) return;

      // Push the user message + an assistant placeholder.
      store.pushUserMessage(trimmed);
      const placeholderId = store.pushAssistantPlaceholder();
      store.setIsSending(true);

      // Snapshot history (excluding the placeholder) for the API.
      const history = useChatStore
        .getState()
        .messages.filter((m) => m.id !== placeholderId && !m.isLoading)
        .map((m) => ({ role: m.role, content: m.content }))
        .slice(-8); // last 8 turns

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: store.sessionId,
            message: trimmed,
            history,
            language: store.language,
            level: store.level,
            topic: store.topic,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to get reply.");
        }
        if (data.sessionId) store.setSessionId(data.sessionId);
        store.finalizeAssistant(
          placeholderId,
          data.reply,
          data.corrections || []
        );
        triggerStatsRefresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Network error.";
        store.markError(placeholderId, msg);
        toast({
          title: "Couldn't reach LinguaBot",
          description: msg,
          variant: "destructive",
        });
      } finally {
        store.setIsSending(false);
      }
    },
    [store, toast, triggerStatsRefresh]
  );

  const handleSend = () => {
    if (!draft.trim()) return;
    sendMessage(draft);
    setDraft("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for newline
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTranscribed = (text: string) => {
    // Auto-send the transcribed text right away for a smooth voice chat.
    sendMessage(text);
  };

  const handleVoiceError = (msg: string) => {
    toast({
      title: "Voice input issue",
      description: msg,
      variant: "destructive",
    });
  };

  const handleClearChat = () => {
    store.reset();
    setDraft("");
    toast({
      title: "Chat cleared",
      description: "Started a fresh conversation.",
    });
  };

  const currentLanguage = LANGUAGES.find((l) => l.code === store.language);
  const hasMessages = store.messages.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-stone-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">
                LinguaBot
              </h1>
              <p className="text-[11px] text-stone-500 leading-tight">
                Your AI Spoken Language Teacher
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-stone-600 bg-stone-100 px-2.5 py-1.5 rounded-full">
              <span>{currentLanguage?.flag}</span>
              <span className="font-medium">{currentLanguage?.name}</span>
              <span className="text-stone-400">·</span>
              <span className="capitalize">{store.level}</span>
            </div>
            {hasMessages && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearChat}
                className="text-stone-500 hover:text-rose-600"
              >
                <Eraser className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
            {/* Mobile sheet trigger */}
            <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[360px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-500" />
                    LinguaBot Panel
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-6">
                  <SettingsPanel
                    language={store.language}
                    level={store.level}
                    topic={store.topic}
                    autoSpeak={store.autoSpeak}
                    onLanguageChange={(v) => {
                      store.setLanguage(v);
                      store.reset();
                    }}
                    onLevelChange={(v) => {
                      store.setLevel(v);
                      store.reset();
                    }}
                    onTopicChange={(v) => {
                      store.setTopic(v);
                      store.reset();
                    }}
                    onAutoSpeakChange={store.setAutoSpeak}
                  />
                  <div className="border-t border-stone-200 pt-4">
                    <ProgressDashboard refreshKey={statsRefresh} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main 2-column layout */}
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-4 lg:py-6 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 lg:gap-6">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:flex lg:flex-col gap-4">
          <div className="rounded-xl bg-white border border-stone-200 p-4 shadow-sm">
            <Tabs defaultValue="setup">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="setup" className="text-xs">
                  <GraduationCap className="h-3.5 w-3.5 mr-1" />
                  Setup
                </TabsTrigger>
                <TabsTrigger value="progress" className="text-xs">
                  <BarChart3 className="h-3.5 w-3.5 mr-1" />
                  Progress
                </TabsTrigger>
              </TabsList>
              <TabsContent value="setup" className="mt-4">
                <SettingsPanel
                  language={store.language}
                  level={store.level}
                  topic={store.topic}
                  autoSpeak={store.autoSpeak}
                  onLanguageChange={(v) => {
                    store.setLanguage(v);
                    store.reset();
                  }}
                  onLevelChange={(v) => {
                    store.setLevel(v);
                    store.reset();
                  }}
                  onTopicChange={(v) => {
                    store.setTopic(v);
                    store.reset();
                  }}
                  onAutoSpeakChange={store.setAutoSpeak}
                />
              </TabsContent>
              <TabsContent value="progress" className="mt-4">
                <ProgressDashboard refreshKey={statsRefresh} />
              </TabsContent>
            </Tabs>
          </div>
        </aside>

        {/* Chat area */}
        <section className="flex flex-col rounded-xl bg-white border border-stone-200 shadow-sm overflow-hidden min-h-[70vh] lg:min-h-[calc(100vh-140px)]">
          {/* Chat scroll area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4"
          >
            {!hasMessages && <EmptyState language={store.language} />}

            {store.messages.map((m) => (
              <MessageBubble
                key={m.id}
                role={m.role}
                content={m.content}
                corrections={m.corrections}
                isLoading={m.isLoading}
                error={m.error}
                autoSpeak={store.autoSpeak}
              />
            ))}
          </div>

          {/* Composer */}
          <div className="border-t border-stone-200 bg-white p-3 sm:p-4">
            <div className="flex flex-col gap-3">
              {/* Voice + Textarea row */}
              <div className="flex items-end gap-3">
                <div className="shrink-0">
                  <VoiceButton
                    disabled={store.isSending}
                    onTranscribed={handleTranscribed}
                    onError={handleVoiceError}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type in English, or tap the mic and speak..."
                    rows={2}
                    className="resize-none bg-stone-50 border-stone-200 focus-visible:ring-emerald-300"
                    disabled={store.isSending}
                  />
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-[11px] text-stone-400">
                      Press <kbd className="px-1 py-0.5 bg-stone-100 rounded border border-stone-200 text-[10px]">Enter</kbd> to send · <kbd className="px-1 py-0.5 bg-stone-100 rounded border border-stone-200 text-[10px]">Shift+Enter</kbd> for new line
                    </p>
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
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
          <p>
            <span className="font-medium text-stone-700">LinguaBot</span> · AI Spoken Language Teacher
          </p>
          <p>
            Voice in · Voice out · Real-time corrections · Multi-language ready
          </p>
        </div>
      </footer>
    </div>
  );
}

function EmptyState({ language }: { language: string }) {
  const lang = LANGUAGES.find((l) => l.code === language);
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-4">
        <Sparkles className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-semibold text-stone-800 mb-1">
        Ready when you are!
      </h2>
      <p className="text-sm text-stone-500 max-w-md mb-4">
        Tap the mic and start speaking in {lang?.name ?? "English"}, or just
        type below. LinguaBot will reply, catch your mistakes, and explain them
        in simple Hinglish.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full max-w-xl mt-2">
        <Tip emoji="🗣️" title="Talk freely" text="Just chat like with a friend." />
        <Tip emoji="✅" title="Get corrected" text="Mistakes flagged with the right version." />
        <Tip emoji="📈" title="See progress" text="Track your sessions & weak spots." />
      </div>
    </div>
  );
}

function Tip({
  emoji,
  title,
  text,
}: {
  emoji: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-left">
      <div className="text-lg mb-0.5">{emoji}</div>
      <div className="text-sm font-medium text-stone-700">{title}</div>
      <div className="text-xs text-stone-500">{text}</div>
    </div>
  );
}
