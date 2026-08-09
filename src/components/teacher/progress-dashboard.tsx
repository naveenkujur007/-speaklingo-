"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  MessagesSquare,
  Mic,
  AlertTriangle,
  Calendar,
  Loader2,
} from "lucide-react";

interface StatsData {
  totalSessions: number;
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  totalMistakes: number;
  mistakesByType: { type: string; count: number }[];
  sessionsByLanguage: { language: string; count: number }[];
  recentMistakes: {
    id: string;
    original: string;
    corrected: string;
    type: string;
    explanation: string;
    createdAt: string;
    session: { language: string; topic: string };
  }[];
}

const TYPE_COLORS: Record<string, string> = {
  grammar: "bg-rose-500",
  spelling: "bg-amber-500",
  vocabulary: "bg-violet-500",
  pronunciation: "bg-sky-500",
  "word-order": "bg-fuchsia-500",
  punctuation: "bg-slate-500",
};

export function ProgressDashboard({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Defer the loading-flag toggle so we don't trigger a synchronous state
    // update inside the effect body.
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
    fetch("/api/stats")
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
  }, [refreshKey]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-8 text-stone-500">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading your progress...
      </div>
    );
  }

  const maxMistakeType = Math.max(
    1,
    ...data.mistakesByType.map((m) => m.count)
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-stone-800 mb-3">
          Your Progress
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            icon={<Calendar className="h-4 w-4" />}
            label="Sessions"
            value={data.totalSessions}
            color="text-emerald-600"
          />
          <StatCard
            icon={<Mic className="h-4 w-4" />}
            label="Your Turns"
            value={data.userMessages}
            color="text-sky-600"
          />
          <StatCard
            icon={<MessagesSquare className="h-4 w-4" />}
            label="Total Msgs"
            value={data.totalMessages}
            color="text-violet-600"
          />
          <StatCard
            icon={<AlertTriangle className="h-4 w-4" />}
            label="Mistakes Caught"
            value={data.totalMistakes}
            color="text-amber-600"
          />
        </div>
      </div>

      {data.mistakesByType.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-stone-600 uppercase tracking-wide mb-2">
            Mistake Types
          </h3>
          <div className="space-y-1.5">
            {data.mistakesByType.map((m) => (
              <div key={m.type} className="flex items-center gap-2">
                <span className="text-xs text-stone-600 w-24 capitalize">
                  {m.type}
                </span>
                <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      TYPE_COLORS[m.type] ?? "bg-stone-500"
                    }`}
                    style={{ width: `${(m.count / maxMistakeType) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-stone-700 w-6 text-right">
                  {m.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.recentMistakes.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-stone-600 uppercase tracking-wide mb-2">
            Recent Corrections
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {data.recentMistakes.map((m) => (
              <div
                key={m.id}
                className="rounded-lg border border-stone-200 bg-white p-2.5 text-xs"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                      TYPE_COLORS[m.type] ?? "bg-stone-400"
                    }`}
                  />
                  <span className="text-[10px] uppercase tracking-wide text-stone-500 font-medium">
                    {m.type}
                  </span>
                  <span className="text-[10px] text-stone-400">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="line-through text-rose-600">
                    {m.original}
                  </span>
                  <span className="text-stone-400">&rarr;</span>
                  <span className="font-semibold text-emerald-700">
                    {m.corrected}
                  </span>
                </div>
                <p className="mt-1 text-stone-600 text-[11px]">
                  {m.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.totalMessages === 0 && (
        <div className="rounded-lg border border-dashed border-stone-300 p-4 text-center text-stone-500 text-sm">
          No data yet. Start a conversation and your progress will appear here.
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card className="p-3 bg-white">
      <div className={`${color} mb-1`}>{icon}</div>
      <div className="text-xl font-bold text-stone-800 leading-none">
        {value}
      </div>
      <div className="text-[11px] text-stone-500 mt-0.5">{label}</div>
    </Card>
  );
}
