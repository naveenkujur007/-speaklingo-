"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Trophy,
  Flame,
  Calendar,
  Target,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/hooks/use-app-store";

interface AchievementVM {
  code: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt: string | null;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  practicedToday: boolean;
}

export function AchievementsSection() {
  const { language, refreshTick } = useAppStore();
  const [achievements, setAchievements] = useState<AchievementVM[]>([]);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
    Promise.all([
      fetch(`/api/achievements?language=${language}`).then((r) => r.json()),
      fetch(`/api/streak?language=${language}`).then((r) => r.json()),
    ])
      .then(([a, s]) => {
        if (cancelled) return;
        setAchievements(a.achievements ?? []);
        setStreak(s);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [language, refreshTick]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-stone-500">
        <Loader2 className="h-5 w-4 animate-spin mr-2" />
        Loading achievements...
      </div>
    );
  }

  const earnedCount = achievements.filter((a) => a.earned).length;

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <Card className="p-4 bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            <div>
              <h1 className="text-lg font-bold">Achievements</h1>
              <p className="text-xs text-amber-50">
                {earnedCount} of {achievements.length} badges unlocked
              </p>
            </div>
          </div>
          <div className="text-3xl font-bold">
            {Math.round((earnedCount / Math.max(1, achievements.length)) * 100)}%
          </div>
        </div>
      </Card>

      {/* Streak stats */}
      {streak && (
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3 bg-white text-center">
            <Flame className="h-5 w-5 text-amber-500 mx-auto mb-1" />
            <div className="text-xl font-bold text-stone-800">
              {streak.currentStreak}
            </div>
            <div className="text-[10px] text-stone-500">Current</div>
          </Card>
          <Card className="p-3 bg-white text-center">
            <Trophy className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
            <div className="text-xl font-bold text-stone-800">
              {streak.longestStreak}
            </div>
            <div className="text-[10px] text-stone-500">Best</div>
          </Card>
          <Card className="p-3 bg-white text-center">
            <Calendar className="h-5 w-5 text-violet-500 mx-auto mb-1" />
            <div className="text-xl font-bold text-stone-800">
              {streak.totalActiveDays}
            </div>
            <div className="text-[10px] text-stone-500">Total days</div>
          </Card>
        </div>
      )}

      {/* Badges grid */}
      <div>
        <h2 className="text-sm font-semibold text-stone-700 mb-2 flex items-center gap-1.5">
          <Target className="h-4 w-4 text-amber-500" />
          Badges
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {achievements.map((a) => (
            <Card
              key={a.code}
              className={cn(
                "p-3 text-center transition-all",
                a.earned
                  ? "bg-gradient-to-br from-amber-50 to-white border-amber-200"
                  : "bg-stone-50 opacity-60 grayscale"
              )}
            >
              <div className="text-3xl mb-1 relative inline-block">
                {a.icon}
                {!a.earned && (
                  <Lock className="absolute -bottom-1 -right-1 h-3.5 w-3.5 text-stone-500 bg-white rounded-full p-0.5" />
                )}
              </div>
              <div className="text-xs font-semibold text-stone-800 leading-tight">
                {a.title}
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">
                {a.description}
              </div>
              {a.earned && a.earnedAt && (
                <Badge className="mt-1.5 text-[9px] bg-emerald-100 text-emerald-700 border-0">
                  {new Date(a.earnedAt).toLocaleDateString()}
                </Badge>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
