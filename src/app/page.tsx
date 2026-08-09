"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChatStore } from "@/hooks/use-chat-store";
import { useAppStore } from "@/hooks/use-app-store";
import { useToast } from "@/hooks/use-toast";
import { MessageBubble } from "@/components/teacher/message-bubble";
import { VoiceButton } from "@/components/teacher/voice-button";
import { SettingsPanel } from "@/components/teacher/settings-panel";
import { ProgressDashboard } from "@/components/teacher/progress-dashboard";
import { SavedWordsBank } from "@/components/teacher/saved-words-bank";
import { HomeSection } from "@/components/sections/home-section";
import { CurriculumSection } from "@/components/sections/curriculum-section";
import { ReviewSection } from "@/components/sections/review-section";
import { PronunciationSection } from "@/components/sections/pronunciation-section";
import { RolePlaySection } from "@/components/sections/roleplay-section";
import { TranslateSection } from "@/components/sections/translate-section";
import { AchievementsSection } from "@/components/sections/achievements-section";
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
  Send,
  Eraser,
  Menu,
  Bot,
  Home as HomeIcon,
  BookOpen,
  MessagesSquare,
  Sparkles,
  Mic,
  ArrowLeftRight,
  Trophy,
  GraduationCap,
  BarChart3,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LANGUAGES } from "@/lib/teacher-config";

export default function Home() {
  const app = useAppStore();
  const store = useChatStore();
  const { toast } = useToast();
  const [draft, setDraft] = useState("");
  const [statsRefresh, setStatsRefresh] = useState(0);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [navSheetOpen, setNavSheetOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync app store settings into chat store so the practice mode still works.
  // Only call setters when the value actually differs to avoid loops.
  const lastSyncRef = useRef({
    language: "",
    level: "",
    topic: "",
    autoSpeak: false,
    voice: "",
    ttsSpeed: 0,
  });
  useEffect(() => {
    const last = lastSyncRef.current;
    if (last.language !== app.language) {
      store.setLanguage(app.language);
      last.language = app.language;
    }
    if (last.level !== app.level) {
      store.setLevel(app.level);
      last.level = app.level;
    }
    if (last.topic !== app.topic) {
      store.setTopic(app.topic);
      last.topic = app.topic;
    }
    if (last.autoSpeak !== app.autoSpeak) {
      store.setAutoSpeak(app.autoSpeak);
      last.autoSpeak = app.autoSpeak;
    }
    if (last.voice !== app.voice) {
      store.setVoice(app.voice);
      last.voice = app.voice;
    }
    if (last.ttsSpeed !== app.ttsSpeed) {
      store.setTtsSpeed(app.ttsSpeed);
      last.ttsSpeed = app.ttsSpeed;
    }
  }, [
    app.language,
    app.level,
    app.topic,
    app.autoSpeak,
    app.voice,
    app.ttsSpeed,
    store,
  ]);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [store.messages]);

  const triggerStatsRefresh = useCallback(() => {
    setStatsRefresh((n) => n + 1);
    app.triggerRefresh();
  }, [app]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || store.isSending) return;

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
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed.");
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
    [store, app, toast, triggerStatsRefresh]
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

  const handleTranscribed = (text: string) => sendMessage(text);

  const handleVoiceError = (msg: string) => {
    toast({ title: "Voice input issue", description: msg, variant: "destructive" });
  };

  const handleClearChat = () => {
    store.reset();
    setDraft("");
    toast({ title: "Chat cleared", description: "Started fresh." });
  };

  const currentLanguage = LANGUAGES.find((l) => l.code === app.language);
  const hasMessages = store.messages.length > 0;

  // NAV items
  const NAV_ITEMS: {
    code: typeof app.section;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { code: "home", label: "Home", icon: <HomeIcon className="h-4 w-4" /> },
    { code: "curriculum", label: "Learn", icon: <BookOpen className="h-4 w-4" /> },
    { code: "practice", label: "Practice", icon: <MessagesSquare className="h-4 w-4" /> },
    { code: "review", label: "Review", icon: <Sparkles className="h-4 w-4" /> },
    { code: "pronunciation", label: "Pronunciation", icon: <Mic className="h-4 w-4" /> },
    { code: "roleplay", label: "Role-Play", icon: <Sparkles className="h-4 w-4" /> },
    { code: "translate", label: "Translator", icon: <ArrowLeftRight className="h-4 w-4" /> },
    { code: "achievements", label: "Badges", icon: <Trophy className="h-4 w-4" /> },
  ];

  const sidebarContent = (
    <Tabs defaultValue="setup">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="setup" className="text-xs">
          <GraduationCap className="h-3.5 w-3.5 mr-1" />
          Setup
        </TabsTrigger>
        <TabsTrigger value="progress" className="text-xs">
          <BarChart3 className="h-3.5 w-3.5 mr-1" />
          Stats
        </TabsTrigger>
        <TabsTrigger value="saved" className="text-xs">
          <Star className="h-3.5 w-3.5 mr-1" />
          Saved
        </TabsTrigger>
      </TabsList>
      <TabsContent value="setup" className="mt-4">
        <SettingsPanel
          language={app.language}
          level={app.level}
          topic={app.topic}
          autoSpeak={app.autoSpeak}
          voice={app.voice}
          ttsSpeed={app.ttsSpeed}
          onLanguageChange={(v) => {
            app.setLanguage(v);
            store.reset();
          }}
          onLevelChange={(v) => {
            app.setLevel(v);
            store.reset();
          }}
          onTopicChange={(v) => {
            app.setTopic(v);
            store.reset();
          }}
          onAutoSpeakChange={app.setAutoSpeak}
          onVoiceChange={app.setVoice}
          onTtsSpeedChange={app.setTtsSpeed}
        />
      </TabsContent>
      <TabsContent value="progress" className="mt-4">
        <ProgressDashboard refreshKey={statsRefresh} />
      </TabsContent>
      <TabsContent value="saved" className="mt-4">
        <SavedWordsBank
          language={app.language}
          voice={app.voice}
          ttsSpeed={app.ttsSpeed}
          refreshKey={statsRefresh}
        />
      </TabsContent>
    </Tabs>
  );

  const renderSection = () => {
    switch (app.section) {
      case "home":
        return <HomeSection />;
      case "curriculum":
        return <CurriculumSection />;
      case "review":
        return <ReviewSection />;
      case "pronunciation":
        return <PronunciationSection />;
      case "roleplay":
        return <RolePlaySection />;
      case "translate":
        return <TranslateSection />;
      case "achievements":
        return <AchievementsSection />;
      case "practice":
      default:
        return (
          <div className="flex flex-col rounded-xl bg-white border border-stone-200 shadow-sm overflow-hidden h-full min-h-[70vh] lg:min-h-[calc(100vh-180px)]">
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4"
            >
              {!hasMessages && <EmptyState language={app.language} />}
              {store.messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  role={m.role}
                  content={m.content}
                  corrections={m.corrections}
                  isLoading={m.isLoading}
                  error={m.error}
                  autoSpeak={app.autoSpeak}
                  voice={app.voice}
                  ttsSpeed={app.ttsSpeed}
                />
              ))}
            </div>
            <div className="border-t border-stone-200 bg-white p-3 sm:p-4">
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
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-stone-200">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">LinguaBot</h1>
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
              <span className="capitalize">{app.level}</span>
            </div>
            {/* Mobile nav sheet */}
            <Sheet open={navSheetOpen} onOpenChange={setNavSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Navigation">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[260px] p-0">
                <SheetHeader className="p-4 border-b border-stone-200">
                  <SheetTitle className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-emerald-500" />
                    LinguaBot
                  </SheetTitle>
                </SheetHeader>
                <nav className="p-2 space-y-0.5">
                  {NAV_ITEMS.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        app.setSection(item.code);
                        setNavSheetOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                        app.section === item.code
                          ? "bg-emerald-50 text-emerald-700 font-medium"
                          : "text-stone-600 hover:bg-stone-100"
                      )}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
            {/* Mobile settings sheet */}
            <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Settings">
                  <GraduationCap className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[360px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-500" />
                    LinguaBot Panel
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-4">{sidebarContent}</div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* 3-column layout: left nav (desktop) | main content | right settings (desktop) */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-4 lg:py-6 grid grid-cols-1 lg:grid-cols-[200px_1fr_300px] gap-4 lg:gap-6">
        {/* Left nav (desktop) */}
        <aside className="hidden lg:flex lg:flex-col">
          <nav className="rounded-xl bg-white border border-stone-200 p-2 shadow-sm sticky top-32 space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => app.setSection(item.code)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                  app.section === item.code
                    ? "bg-emerald-50 text-emerald-700 font-medium"
                    : "text-stone-600 hover:bg-stone-100"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <section className="min-h-[70vh] lg:min-h-[calc(100vh-180px)]">
          {renderSection()}
        </section>

        {/* Right sidebar (desktop) */}
        <aside className="hidden lg:flex lg:flex-col">
          <div className="rounded-xl bg-white border border-stone-200 p-4 shadow-sm sticky top-32">
            {sidebarContent}
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
          <p>
            <span className="font-medium text-stone-700">LinguaBot</span> · AI
            Spoken Language Teacher · A1 → C2
          </p>
          <p>
            Home · Learn · Practice · Review · Pronounce · Role-Play · Translate · Badges
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
        Let&apos;s practice {lang?.name ?? "English"}!
      </h2>
      <p className="text-sm text-stone-500 max-w-md mb-4">
        Tap the mic and start speaking, or type below. LinguaBot will reply in an
        energetic voice, catch your mistakes, and explain them in Hinglish.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full max-w-xl mt-2">
        <Tip emoji="🗣️" title="Talk freely" text="Chat like with a friend." />
        <Tip emoji="✅" title="Get corrected" text="Mistakes flagged instantly." />
        <Tip emoji="📈" title="See progress" text="Track streaks & badges." />
      </div>
    </div>
  );
}

function Tip({ emoji, title, text }: { emoji: string; title: string; text: string }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-left">
      <div className="text-lg mb-0.5">{emoji}</div>
      <div className="text-sm font-medium text-stone-700">{title}</div>
      <div className="text-xs text-stone-500">{text}</div>
    </div>
  );
}
