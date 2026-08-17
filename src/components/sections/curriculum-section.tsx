"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Lock,
  CheckCircle2,
  Circle,
  PlayCircle,
  Clock,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/hooks/use-app-store";
import { LessonView } from "@/components/teacher/lesson-view";
import type { CEFRLevel } from "@/lib/curriculum";

interface CurriculumNodeVM {
  id: string;
  language: string;
  level: CEFRLevel;
  order: number;
  title: string;
  goal: string;
  topic: string;
  focus: string;
  estimatedMinutes: number;
  status: "locked" | "available" | "in-progress" | "completed";
  score: number | null;
  completedAt: string | null;
}

interface CurriculumLevelVM {
  level: CEFRLevel;
  title: string;
  description: string;
  nodes: CurriculumNodeVM[];
}

interface CurriculumData {
  curriculum: {
    language: string;
    name: string;
    flag: string;
    levels: CurriculumLevelVM[];
  };
  totalNodes: number;
  completedCount: number;
}

const LEVEL_COLORS: Record<CEFRLevel, { bg: string; text: string; ring: string }> = {
  A1: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "border-emerald-200" },
  A2: { bg: "bg-teal-50", text: "text-teal-700", ring: "border-teal-200" },
  B1: { bg: "bg-sky-50", text: "text-sky-700", ring: "border-sky-200" },
  B2: { bg: "bg-violet-50", text: "text-violet-700", ring: "border-violet-200" },
  C1: { bg: "bg-fuchsia-50", text: "text-fuchsia-700", ring: "border-fuchsia-200" },
  C2: { bg: "bg-amber-50", text: "text-amber-700", ring: "border-amber-200" },
};

export function CurriculumSection() {
  const { language, refreshTick, triggerRefresh, voice, ttsSpeed, hintLanguage } = useAppStore();
  const [data, setData] = useState<CurriculumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
    fetch(`/api/curriculum?language=${language}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [language, refreshTick]);

  const markInProgress = async (nodeId: string) => {
    setActiveNodeId(nodeId);
    await fetch("/api/curriculum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, nodeId, action: "start" }),
    });
    triggerRefresh();
  };

  const handleLessonComplete = async (score?: number) => {
    if (!activeNodeId) return;
    await fetch("/api/curriculum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        nodeId: activeNodeId,
        action: "complete",
        score,
      }),
    });
    triggerRefresh();
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-12 text-stone-500">
        <Loader2 className="h-5 w-4 animate-spin mr-2" />
        Loading curriculum...
      </div>
    );
  }

  // If a lesson is active, show the LessonView in a "lesson mode" wrapper.
  if (activeNodeId) {
    const activeNode = data.curriculum.levels
      .flatMap((l) => l.nodes)
      .find((n) => n.id === activeNodeId);
    if (!activeNode) {
      setActiveNodeId(null);
      return null;
    }
    return (
      <div className="space-y-4 pb-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setActiveNodeId(null)}>
            ← Back to path
          </Button>
          <Badge variant="secondary">
            {activeNode.level} · Lesson {activeNode.order}
          </Badge>
        </div>
        <Card className="p-4 bg-white">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-stone-800">
              {activeNode.title}
            </h2>
            <p className="text-sm text-stone-600">{activeNode.goal}</p>
            <p className="text-xs text-stone-500 mt-1">
              📚 Focus: {activeNode.focus}
            </p>
          </div>
        </Card>
        <LessonView
          language={language}
          level={mapCefrToDifficulty(activeNode.level)}
          topic={activeNode.topic}
          voice={voice}
          ttsSpeed={ttsSpeed}
          onStatsRefresh={triggerRefresh}
          hintLanguage={hintLanguage}
        />
        <Card className="p-4 bg-emerald-50 border-emerald-200">
          <p className="text-sm text-stone-700 mb-2">
            🎉 Finished this lesson? Mark it complete to unlock the next one!
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => handleLessonComplete(80)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Mark Complete
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const progressPct =
    data.totalNodes > 0
      ? Math.round((data.completedCount / data.totalNodes) * 100)
      : 0;

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <Card className="p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-stone-800">
              Learning Path · {data.curriculum.name}
            </h1>
            <p className="text-xs text-stone-500">
              From absolute beginner (A1) to mastery (C2). Complete lessons in
              order to unlock the next.
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-emerald-600">
              {progressPct}%
            </div>
            <div className="text-[11px] text-stone-500">
              {data.completedCount}/{data.totalNodes} done
            </div>
          </div>
        </div>
        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </Card>

      {/* Levels */}
      {data.curriculum.levels.map((level) => {
        const colors = LEVEL_COLORS[level.level];
        const levelDone = level.nodes.filter(
          (n) => n.status === "completed"
        ).length;
        return (
          <div key={level.level} className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-12 items-center justify-center rounded-lg text-xs font-bold",
                  colors.bg,
                  colors.text
                )}
              >
                {level.level}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-stone-800">
                  {level.title.replace(/^\w+\s·\s/, "")}
                </h2>
                <p className="text-[11px] text-stone-500">
                  {level.description}
                </p>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {levelDone}/{level.nodes.length}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 sm:pl-14">
              {level.nodes.map((node) => {
                const isLocked = node.status === "locked";
                const isDone = node.status === "completed";
                return (
                  <Card
                    key={node.id}
                    className={cn(
                      "p-3 transition-all",
                      isLocked
                        ? "bg-stone-50 opacity-70"
                        : "bg-white hover:shadow-md cursor-pointer",
                      !isLocked && colors.ring
                    )}
                    onClick={() => !isLocked && markInProgress(node.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">
                        {isLocked ? (
                          <Lock className="h-5 w-5 text-stone-400" />
                        ) : isDone ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <PlayCircle className="h-5 w-5 text-emerald-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-stone-400 font-mono">
                            {node.level}.{node.order}
                          </span>
                          {isDone && node.score !== null && (
                            <Badge className="text-[9px] h-4 bg-emerald-100 text-emerald-700 border-0">
                              <Trophy className="h-2.5 w-2.5 mr-0.5" />
                              {node.score}%
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-sm font-medium text-stone-800 leading-tight">
                          {node.title}
                        </h3>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {node.goal}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-stone-400">
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3" />
                            {node.estimatedMinutes} min
                          </span>
                          <span>·</span>
                          <span className="truncate">{node.focus}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function mapCefrToDifficulty(level: CEFRLevel): "beginner" | "intermediate" | "advanced" {
  if (level === "A1" || level === "A2") return "beginner";
  if (level === "B1" || level === "B2") return "intermediate";
  return "advanced";
}
