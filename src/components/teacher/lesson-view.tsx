"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  RefreshCw,
  Loader2,
  BookOpen,
  Brain,
  MessagesSquare,
  ListChecks,
  Home as HomeIcon,
  Star,
  Volume2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LANGUAGES,
  TOPICS,
  DIFFICULTIES,
  type Difficulty,
  type Lesson,
  type VocabItem,
} from "@/lib/teacher-config";
import { VocabFlashcards } from "./vocab-flashcards";
import { QuizRunner } from "./quiz-runner";

interface LessonViewProps {
  language: string;
  level: Difficulty;
  topic: string;
  voice: string;
  ttsSpeed: number;
  onStatsRefresh: () => void;
  hintLanguage?: string;
}

interface StarredResponse {
  items: { id: string; item: string; type: string; meaning: string; example: string | null }[];
}

export function LessonView({
  language,
  level,
  topic,
  voice,
  ttsSpeed,
  onStatsRefresh,
  hintLanguage,
}: LessonViewProps) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [starredSet, setStarredSet] = useState<Set<string>>(new Set());

  const langInfo = LANGUAGES.find((l) => l.code === language);
  const topicInfo = TOPICS.find((t) => t.code === topic);
  const levelInfo = DIFFICULTIES.find((d) => d.code === level);

  const fetchLesson = useCallback(
    async (opts: { regenerate?: boolean } = {}) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/lesson", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language,
            level,
            topic,
            regenerate: opts.regenerate ?? false,
            hintLanguage,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load lesson.");
        }
        setLesson(data.lesson);
        setCached(!!data.cached);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Network error.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [language, level, topic, hintLanguage]
  );

  // Load starred words for this language so the cards show "Saved" state.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/learned?language=${encodeURIComponent(language)}`)
      .then((r) => r.json())
      .then((d: StarredResponse) => {
        if (!cancelled && d.items) {
          setStarredSet(new Set(d.items.map((i) => i.item)));
        }
      })
      .catch(() => {})
      .finally(() => {});
    return () => {
      cancelled = true;
    };
  }, [language]);

  // Auto-load today's lesson (or generate one) on mount / when config changes.
  useEffect(() => {
    fetchLesson({ regenerate: false });
  }, [fetchLesson]);

  const handleStar = async (item: VocabItem) => {
    try {
      await fetch("/api/learned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          type: "word",
          item: item.word,
          meaning: item.meaning,
          example: item.example,
        }),
      });
      setStarredSet((prev) => new Set(prev).add(item.word));
      onStatsRefresh();
    } catch {
      // ignore
    }
  };

  const speak = async (text: string) => {
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
    }
  };

  return (
    <div className="space-y-4">
      {/* Lesson header */}
      <Card className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-emerald-50 mb-1">
              <span>{langInfo?.flag} {langInfo?.name}</span>
              <span>·</span>
              <span>{levelInfo?.label}</span>
              <span>·</span>
              <span>{topicInfo?.label}</span>
              {cached && (
                <Badge className="bg-white/20 text-white border-0 ml-1 text-[10px]">
                  Today&apos;s lesson
                </Badge>
              )}
            </div>
            <h2 className="text-lg font-bold leading-tight">
              {lesson?.title || "Today's Lesson"}
            </h2>
            {lesson?.intro && (
              <p className="text-sm text-emerald-50 mt-1">{lesson.intro}</p>
            )}
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fetchLesson({ regenerate: true })}
            disabled={loading}
            className="bg-white/20 text-white hover:bg-white/30 border-0 shrink-0"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-1 hidden sm:inline">New</span>
          </Button>
        </div>
      </Card>

      {error && (
        <Card className="p-4 bg-rose-50 border-rose-200">
          <div className="flex items-start gap-2 text-rose-700">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Couldn&apos;t load lesson</p>
              <p className="text-xs text-rose-600 mt-0.5">{error}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => fetchLesson({ regenerate: true })}
          >
            Try Again
          </Button>
        </Card>
      )}

      {loading && !lesson && (
        <Card className="p-8 text-center bg-white">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-500 mb-2" />
          <p className="text-sm text-stone-500">
            Teacher is preparing your lesson...
          </p>
        </Card>
      )}

      {lesson && (
        <Tabs defaultValue="vocab" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="vocab" className="text-xs py-2 flex flex-col gap-0.5">
              <BookOpen className="h-3.5 w-3.5" />
              Vocab
              <span className="text-[10px] text-stone-400">
                {lesson.vocabulary.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="grammar" className="text-xs py-2 flex flex-col gap-0.5">
              <Brain className="h-3.5 w-3.5" />
              Grammar
            </TabsTrigger>
            <TabsTrigger value="phrases" className="text-xs py-2 flex flex-col gap-0.5">
              <MessagesSquare className="h-3.5 w-3.5" />
              Phrases
              <span className="text-[10px] text-stone-400">
                {lesson.phrases.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="quiz" className="text-xs py-2 flex flex-col gap-0.5">
              <ListChecks className="h-3.5 w-3.5" />
              Quiz
              <span className="text-[10px] text-stone-400">
                {lesson.quiz.length}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* VOCAB */}
          <TabsContent value="vocab" className="mt-3">
            <Card className="p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-stone-700 flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-emerald-500" />
                  Vocabulary Flashcards
                </h3>
                <span className="text-xs text-stone-500 flex items-center gap-1">
                  <Star className="h-3 w-3 text-amber-500" />
                  {starredSet.size} saved
                </span>
              </div>
              <VocabFlashcards
                items={lesson.vocabulary}
                voice={voice}
                ttsSpeed={ttsSpeed}
                onStar={handleStar}
                starredSet={starredSet}
              />
            </Card>
          </TabsContent>

          {/* GRAMMAR */}
          <TabsContent value="grammar" className="mt-3">
            <Card className="p-4 bg-white space-y-3">
              <h3 className="text-sm font-semibold text-stone-700 flex items-center gap-1.5">
                <Brain className="h-4 w-4 text-emerald-500" />
                Grammar Point
              </h3>
              <div className="rounded-lg bg-violet-50 border border-violet-200 p-3">
                <div className="text-xs text-violet-600 uppercase tracking-wide mb-1">
                  Rule
                </div>
                <p className="text-sm text-stone-800 font-medium">
                  {lesson.grammar.title}
                </p>
                <p className="text-sm text-stone-700 mt-1">
                  {lesson.grammar.rule}
                </p>
              </div>

              {lesson.grammar.structure && (
                <div className="rounded-lg bg-stone-50 border border-stone-200 p-3">
                  <div className="text-xs text-stone-500 uppercase tracking-wide mb-1">
                    Structure
                  </div>
                  <p className="text-sm font-mono text-stone-800">
                    {lesson.grammar.structure}
                  </p>
                </div>
              )}

              {lesson.grammar.examples.length > 0 && (
                <div>
                  <div className="text-xs text-stone-500 uppercase tracking-wide mb-2">
                    Examples
                  </div>
                  <div className="space-y-2">
                    {lesson.grammar.examples.map((ex, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 rounded-lg bg-emerald-50/60 border border-emerald-200 p-2.5"
                      >
                        <span className="text-sm text-stone-800 flex-1 italic">
                          &ldquo;{ex}&rdquo;
                        </span>
                        <button
                          type="button"
                          onClick={() => speak(ex)}
                          className="text-stone-400 hover:text-emerald-600 shrink-0"
                          aria-label="Hear example"
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lesson.grammar.commonMistake && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <div className="text-xs text-amber-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Common Mistake
                  </div>
                  <p className="text-sm text-stone-700">
                    {lesson.grammar.commonMistake}
                  </p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* PHRASES */}
          <TabsContent value="phrases" className="mt-3">
            <Card className="p-4 bg-white space-y-2">
              <h3 className="text-sm font-semibold text-stone-700 flex items-center gap-1.5 mb-2">
                <MessagesSquare className="h-4 w-4 text-emerald-500" />
                Survival Phrases
              </h3>
              {lesson.phrases.map((p, i) => {
                const isStarred = starredSet.has(p.phrase);
                return (
                  <div
                    key={i}
                    className="rounded-lg border border-stone-200 bg-stone-50/40 p-3"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-800">
                          {p.phrase}
                        </p>
                        <p className="text-xs text-stone-600 mt-0.5">
                          {p.meaning}
                        </p>
                        <p className="text-[11px] text-stone-500 mt-1 italic">
                          🗨️ {p.when}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => speak(p.phrase)}
                          className="text-stone-400 hover:text-emerald-600 p-1"
                          aria-label="Hear phrase"
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch("/api/learned", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                language,
                                type: "phrase",
                                item: p.phrase,
                                meaning: p.meaning,
                                example: null,
                              }),
                            });
                            setStarredSet((prev) => new Set(prev).add(p.phrase));
                            onStatsRefresh();
                          }}
                          className={cn(
                            "p-1",
                            isStarred
                              ? "text-amber-500"
                              : "text-stone-300 hover:text-amber-500"
                          )}
                          aria-label="Save phrase"
                        >
                          <Star className={cn("h-4 w-4", isStarred && "fill-current")} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </Card>
          </TabsContent>

          {/* QUIZ */}
          <TabsContent value="quiz" className="mt-3">
            <QuizRunner
              questions={lesson.quiz}
              voice={voice}
              ttsSpeed={ttsSpeed}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Homework */}
      {lesson?.homework && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-2">
            <HomeIcon className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                Homework
              </div>
              <p className="text-sm text-stone-700">{lesson.homework}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
