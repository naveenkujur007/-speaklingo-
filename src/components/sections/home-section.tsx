"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Flame,
  Trophy,
  BookOpen,
  Mic,
  Star,
  Target,
  Calendar,
  Volume2,
  Loader2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LANGUAGES } from "@/lib/teacher-config";
import { useAppStore } from "@/hooks/use-app-store";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  practicedToday: boolean;
}

interface WordOfDay {
  word: string;
  pronunciation: string;
  partOfSpeech: string;
  meaning: string;
  example: string;
  exampleTranslation: string;
  funFact: string;
}

interface CurriculumSummary {
  totalNodes: number;
  completedCount: number;
}

interface StatsData {
  totalMessages: number;
  userMessages: number;
  totalMistakes: number;
}

export function HomeSection() {
  const { language, setSection, refreshTick, triggerRefresh } = useAppStore();
  const langInfo = LANGUAGES.find((l) => l.code === language);

  const [streak, setStreak] = useState<StreakData | null>(null);
  const [word, setWord] = useState<WordOfDay | null>(null);
  const [curriculum, setCurriculum] = useState<CurriculumSummary | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
    Promise.all([
      fetch(`/api/streak?language=${language}`).then((r) => r.json()),
      fetch(`/api/word-of-day?language=${language}`).then((r) => r.json()),
      fetch(`/api/curriculum?language=${language}`).then((r) => r.json()),
      fetch(`/api/stats`).then((r) => r.json()),
    ])
      .then(([s, w, c, st]) => {
        if (cancelled) return;
        setStreak(s);
        setWord(w.word ?? null);
        setCurriculum({ totalNodes: c.totalNodes, completedCount: c.completedCount });
        setStats(st);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [language, refreshTick]);

  const speakWord = async (text: string) => {
    setSpeaking(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voice: useAppStore.getState().voice,
          speed: useAppStore.getState().ttsSpeed,
        }),
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-stone-500">
        <Loader2 className="h-5 w-4 animate-spin mr-2" />
        Loading your dashboard...
      </div>
    );
  }

  const progressPct =
    curriculum && curriculum.totalNodes > 0
      ? Math.round((curriculum.completedCount / curriculum.totalNodes) * 100)
      : 0;

  return (
    <div className="space-y-4 pb-6">
      {/* Hero greeting */}
      <Card className="p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-emerald-50 mb-1">
              {langInfo?.flag} {langInfo?.name} · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </p>
            <h1 className="text-xl font-bold leading-tight">
              {streak?.practicedToday
                ? "Welcome back! Ready for more? 🚀"
                : "Let's start learning today! ✨"}
            </h1>
            <p className="text-sm text-emerald-50 mt-1">
              {curriculum?.completedCount === 0
                ? "Begin with your first lesson and build a daily habit."
                : `You've completed ${curriculum?.completedCount} of ${curriculum?.totalNodes} lessons. Keep going!`}
            </p>
          </div>
          <div className="shrink-0 text-center">
            <div className="flex items-center gap-1 text-2xl font-bold">
              <Flame className="h-6 w-6 text-amber-300" />
              {streak?.currentStreak ?? 0}
            </div>
            <p className="text-[10px] text-emerald-50 uppercase tracking-wide">
              day streak
            </p>
          </div>
        </div>
      </Card>

      {/* Quick stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile
          icon={<Flame className="h-4 w-4" />}
          label="Current Streak"
          value={`${streak?.currentStreak ?? 0} days`}
          color="text-amber-600 bg-amber-50"
        />
        <StatTile
          icon={<Trophy className="h-4 w-4" />}
          label="Best Streak"
          value={`${streak?.longestStreak ?? 0} days`}
          color="text-emerald-600 bg-emerald-50"
        />
        <StatTile
          icon={<BookOpen className="h-4 w-4" />}
          label="Lessons Done"
          value={`${curriculum?.completedCount ?? 0}/${curriculum?.totalNodes ?? 0}`}
          color="text-violet-600 bg-violet-50"
        />
        <StatTile
          icon={<Mic className="h-4 w-4" />}
          label="Chats Sent"
          value={`${stats?.userMessages ?? 0}`}
          color="text-sky-600 bg-sky-50"
        />
      </div>

      {/* Continue learning */}
      <Card className="p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-stone-800 flex items-center gap-1.5">
            <Target className="h-4 w-4 text-emerald-500" />
            Continue Learning
          </h2>
          <span className="text-xs text-stone-500">{progressPct}% complete</span>
        </div>
        <div className="h-2 bg-stone-100 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <QuickAction
            onClick={() => setSection("curriculum")}
            icon={<BookOpen className="h-4 w-4" />}
            title="Next Lesson"
            subtitle="Structured path A1 → C2"
            color="bg-emerald-500 hover:bg-emerald-600"
          />
          <QuickAction
            onClick={() => setSection("practice")}
            icon={<Mic className="h-4 w-4" />}
            title="Practice Talk"
            subtitle="Chat with AI teacher"
            color="bg-sky-500 hover:bg-sky-600"
          />
          <QuickAction
            onClick={() => setSection("review")}
            icon={<Sparkles className="h-4 w-4" />}
            title="Review Cards"
            subtitle="Spaced repetition"
            color="bg-violet-500 hover:bg-violet-600"
          />
        </div>
      </Card>

      {/* Word of the Day */}
      {word && (
        <Card className="p-4 bg-gradient-to-br from-amber-50 to-white border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-stone-800 flex items-center gap-1.5">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              Word of the Day
            </h2>
            <span className="text-[11px] text-stone-500">
              {new Date().toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-2xl font-bold text-stone-800">
                  {word.word}
                </h3>
                <span className="text-xs text-stone-500 italic">
                  /{word.pronunciation}/
                </span>
                <span className="text-[10px] uppercase text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded">
                  {word.partOfSpeech}
                </span>
                <button
                  type="button"
                  onClick={() => speakWord(word.word)}
                  className="text-stone-400 hover:text-emerald-600 p-1"
                  aria-label="Hear word"
                >
                  {speaking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-sm text-stone-700 mt-1">
                <span className="font-medium">Meaning:</span> {word.meaning}
              </p>
              <p className="text-sm text-stone-600 italic mt-1">
                &ldquo;{word.example}&rdquo;
              </p>
              <p className="text-xs text-stone-500 mt-0.5">
                {word.exampleTranslation}
              </p>
              <p className="text-xs text-amber-700 bg-amber-100/60 rounded p-2 mt-2">
                💡 {word.funFact}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Quick links row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <SmallLink
          onClick={() => setSection("pronunciation")}
          icon={<Mic className="h-4 w-4" />}
          label="Pronunciation Lab"
          hint="Score your speaking"
        />
        <SmallLink
          onClick={() => setSection("roleplay")}
          icon={<Sparkles className="h-4 w-4" />}
          label="Role-Play Scenes"
          hint="Real-life situations"
        />
        <SmallLink
          onClick={() => setSection("translate")}
          icon={<ArrowRight className="h-4 w-4" />}
          label="Translator"
          hint="Any phrase, instant"
        />
        <SmallLink
          onClick={() => setSection("achievements")}
          icon={<Trophy className="h-4 w-4" />}
          label="Badges"
          hint="Your achievements"
        />
      </div>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card className="p-3 bg-white">
      <div className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg mb-2", color)}>
        {icon}
      </div>
      <div className="text-lg font-bold text-stone-800 leading-tight">
        {value}
      </div>
      <div className="text-[11px] text-stone-500">{label}</div>
    </Card>
  );
}

function QuickAction({
  onClick,
  icon,
  title,
  subtitle,
  color,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-left p-3 rounded-lg text-white transition-colors shadow-sm",
        color
      )}
    >
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <p className="text-[11px] text-white/80">{subtitle}</p>
    </button>
  );
}

function SmallLink({
  onClick,
  icon,
  label,
  hint,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 p-2.5 rounded-lg border border-stone-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors text-left"
    >
      <span className="text-stone-500 shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-xs font-medium text-stone-800">{label}</div>
        <div className="text-[10px] text-stone-500 truncate">{hint}</div>
      </div>
    </button>
  );
}
