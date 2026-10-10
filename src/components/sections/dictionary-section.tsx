"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen, Search, Loader2, Volume2, ArrowLeft,
  Lightbulb, Sparkles, BookMarked,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/hooks/use-app-store";
import { speakText } from "@/lib/speak";
import { LANGUAGES } from "@/lib/teacher-config";

interface DictEntry {
  word: string;
  pronunciation: string;
  partOfSpeech: string;
  meaning: string;
  definition: string;
  examples: string[];
  exampleTranslations: string[];
  synonyms: string[];
  antonyms: string[];
  related: string[];
}

export function DictionarySection({ onBack }: { onBack: () => void }) {
  const app = useAppStore();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [entry, setEntry] = useState<DictEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const langInfo = LANGUAGES.find((l) => l.code === app.language);

  const handleSearch = async (word?: string) => {
    const query = (word || search).trim();
    if (!query) return;

    setLoading(true);
    setError(null);
    setEntry(null);

    // Save to recent
    setRecentSearches((prev) => {
      const next = [query, ...prev.filter((s) => s.toLowerCase() !== query.toLowerCase())].slice(0, 10);
      try { localStorage.setItem("speaklingo_dict_recent", JSON.stringify(next)); } catch {}
      return next;
    });

    try {
      const res = await fetch("/api/dictionary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: query,
          language: app.language,
          hintLanguage: app.hintLanguage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lookup failed");
      setEntry(data.entry);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to look up word.");
    } finally {
      setLoading(false);
    }
  };

  const speak = async (text: string) => {
    await speakText(text);
  };

  // Load recent searches on mount
  useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("speaklingo_dict_recent") || "[]");
      if (Array.isArray(saved)) setRecentSearches(saved);
    } catch {}
  });

  return (
    <div className="space-y-4 pb-6">
      {/* Header with Back button */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Card className="p-4 bg-gradient-to-br from-sky-500 to-blue-600 text-white border-0 shadow-md flex-1">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <div>
              <h1 className="text-lg font-bold">Dictionary</h1>
              <p className="text-xs text-sky-50">
                {langInfo?.flag} {langInfo?.name} → meanings in {app.hintLanguage}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2">
        <Input
          placeholder={`Search any word in ${langInfo?.name ?? "your language"}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
          className="bg-white text-base"
          autoFocus
        />
        <Button onClick={() => handleSearch()} disabled={loading || !search.trim()} size="icon" className="shrink-0 bg-sky-500 hover:bg-sky-600 text-white">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
        </Button>
      </div>

      {/* Recent searches */}
      {!entry && !loading && !error && recentSearches.length > 0 && (
        <div>
          <p className="text-xs text-stone-400 mb-2">Recent searches:</p>
          <div className="flex flex-wrap gap-1.5">
            {recentSearches.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setSearch(s); handleSearch(s); }}
                className="text-xs px-2.5 py-1 rounded-full bg-stone-100 hover:bg-sky-100 text-stone-600 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <Card className="p-8 text-center bg-white">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-sky-500 mb-2" />
          <p className="text-sm text-stone-500">Looking up "{search}" in {langInfo?.name} dictionary...</p>
        </Card>
      )}

      {/* Error */}
      {error && !loading && (
        <Card className="p-4 bg-rose-50 border-rose-200">
          <p className="text-sm text-rose-600">{error}</p>
          <Button size="sm" variant="outline" className="mt-2" onClick={() => handleSearch()}>Try Again</Button>
        </Card>
      )}

      {/* Dictionary Entry */}
      {entry && !loading && (
        <div className="space-y-3">
          {/* Word header */}
          <Card className="p-4 bg-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-stone-800">{entry.word}</h2>
                  <button type="button" onClick={() => speak(entry.word)} className="text-stone-400 hover:text-sky-600">
                    <Volume2 className="h-5 w-5" />
                  </button>
                </div>
                {entry.pronunciation && (
                  <p className="text-sm text-stone-400 italic">/{entry.pronunciation}/</p>
                )}
                {entry.partOfSpeech && (
                  <span className="inline-block mt-1 text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                    {entry.partOfSpeech}
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Meaning */}
          {entry.meaning && (
            <Card className="p-4 bg-emerald-50 border-emerald-200">
              <div className="text-[10px] uppercase tracking-wide text-emerald-600 font-semibold mb-1">Meaning ({app.hintLanguage})</div>
              <p className="text-sm text-stone-800">{entry.meaning}</p>
            </Card>
          )}

          {/* Definition */}
          {entry.definition && (
            <Card className="p-4 bg-white">
              <div className="text-[10px] uppercase tracking-wide text-stone-400 font-semibold mb-1">Definition</div>
              <p className="text-sm text-stone-700">{entry.definition}</p>
            </Card>
          )}

          {/* Examples */}
          {entry.examples && entry.examples.length > 0 && (
            <Card className="p-4 bg-white space-y-2">
              <div className="text-[10px] uppercase tracking-wide text-stone-400 font-semibold">Examples</div>
              {entry.examples.map((ex, i) => (
                <div key={i} className="rounded-lg bg-sky-50/50 border border-sky-100 p-2.5">
                  <div className="flex items-start gap-2">
                    <p className="text-sm text-stone-800 italic flex-1">"{ex}"</p>
                    <button type="button" onClick={() => speak(ex)} className="text-stone-400 hover:text-sky-600 shrink-0">
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </div>
                  {entry.exampleTranslations?.[i] && (
                    <p className="text-xs text-stone-500 mt-1">{entry.exampleTranslations[i]}</p>
                  )}
                </div>
              ))}
            </Card>
          )}

          {/* Synonyms & Antonyms */}
          <div className="grid grid-cols-2 gap-3">
            {entry.synonyms && entry.synonyms.length > 0 && (
              <Card className="p-3 bg-emerald-50/40 border-emerald-100">
                <div className="text-[10px] uppercase tracking-wide text-emerald-600 font-semibold mb-1.5">Synonyms</div>
                <div className="flex flex-wrap gap-1">
                  {entry.synonyms.map((s, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">{s}</span>
                  ))}
                </div>
              </Card>
            )}
            {entry.antonyms && entry.antonyms.length > 0 && (
              <Card className="p-3 bg-rose-50/40 border-rose-100">
                <div className="text-[10px] uppercase tracking-wide text-rose-600 font-semibold mb-1.5">Antonyms</div>
                <div className="flex flex-wrap gap-1">
                  {entry.antonyms.map((a, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-700">{a}</span>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Related words */}
          {entry.related && entry.related.length > 0 && (
            <Card className="p-3 bg-violet-50/40 border-violet-100">
              <div className="text-[10px] uppercase tracking-wide text-violet-600 font-semibold mb-1.5 flex items-center gap-1">
                <Lightbulb className="h-3 w-3" /> Related Words
              </div>
              <div className="space-y-1">
                {entry.related.map((r, i) => (
                  <p key={i} className="text-xs text-stone-600">{r}</p>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Empty state */}
      {!entry && !loading && !error && recentSearches.length === 0 && (
        <div className="text-center py-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 mx-auto mb-3">
            <BookMarked className="h-7 w-7" />
          </div>
          <p className="text-sm text-stone-500 max-w-md mx-auto">
            Search any word in {langInfo?.name ?? "your learning language"} to get
            a complete dictionary entry — meaning, definition, examples,
            synonyms, antonyms, and related words.
          </p>
        </div>
      )}
    </div>
  );
}
