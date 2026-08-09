"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2, Loader2, Trash2, Star } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SavedItem {
  id: string;
  language: string;
  type: string;
  item: string;
  meaning: string;
  example: string | null;
  createdAt: string;
}

export function SavedWordsBank({
  language,
  voice,
  ttsSpeed,
  refreshKey,
}: {
  language: string;
  voice?: string;
  ttsSpeed?: number;
  refreshKey: number;
}) {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "word" | "phrase">("all");

  useEffect(() => {
    let cancelled = false;
    // Defer the loading-flag toggle to avoid a synchronous state update
    // inside the effect body.
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
    fetch(`/api/learned?language=${encodeURIComponent(language)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.items) setItems(d.items);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [language, refreshKey]);

  const filtered = items.filter((i) => filter === "all" || i.type === filter);

  const speak = async (text: string) => {
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice, speed: ttsSpeed }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      await new Audio(URL.createObjectURL(blob)).play();
    } catch {
      // ignore
    }
  };

  const remove = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/learned?id=${id}`, { method: "DELETE" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-stone-500">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading saved words...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-stone-600 uppercase tracking-wide">
          Saved Bank ({items.length})
        </h3>
      </div>

      {items.length > 0 && (
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="all" className="text-[11px]">
              All ({items.length})
            </TabsTrigger>
            <TabsTrigger value="word" className="text-[11px]">
              Words ({items.filter((i) => i.type === "word").length})
            </TabsTrigger>
            <TabsTrigger value="phrase" className="text-[11px]">
              Phrases ({items.filter((i) => i.type === "phrase").length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-300 p-4 text-center text-stone-500 text-sm">
          <Star className="h-5 w-5 mx-auto text-stone-300 mb-1" />
          No saved {filter === "all" ? "items" : `${filter}s`} yet.
          <p className="text-xs mt-1">
            Tap the star icon on flashcards & phrases to save them here for
            review.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {filtered.map((it) => (
            <Card
              key={it.id}
              className="p-2.5 bg-white flex items-start gap-2"
            >
              <button
                type="button"
                onClick={() => speak(it.item)}
                className="shrink-0 text-stone-400 hover:text-emerald-600 p-1"
                aria-label="Hear"
              >
                <Volume2 className="h-4 w-4" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-stone-800">
                    {it.item}
                  </span>
                  <span className="text-[10px] uppercase text-stone-400 bg-stone-100 px-1 rounded">
                    {it.type}
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-0.5">{it.meaning}</p>
                {it.example && (
                  <p className="text-[11px] text-stone-500 italic mt-0.5">
                    &ldquo;{it.example}&rdquo;
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => remove(it.id)}
                className="shrink-0 text-stone-300 hover:text-rose-500 p-1"
                aria-label="Remove"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
