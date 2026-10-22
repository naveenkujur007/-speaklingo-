"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookMarked, Loader2, Volume2, Search, Star, ChevronLeft,
  Library, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/hooks/use-app-store";
import { speakText } from "@/lib/speak";

interface VocabWord { word: string; pronunciation: string; meaning: string; }
interface VocabCategory { code: string; label: string; icon: string; }

const CATEGORIES: VocabCategory[] = [
  { code: "greetings", label: "Greetings", icon: "👋" },
  { code: "numbers", label: "Numbers", icon: "🔢" },
  { code: "colors", label: "Colors", icon: "🎨" },
  { code: "family", label: "Family", icon: "👨‍👩‍👧‍👦" },
  { code: "food", label: "Food & Drinks", icon: "🍽️" },
  { code: "travel", label: "Travel", icon: "✈️" },
  { code: "shopping", label: "Shopping", icon: "🛍️" },
  { code: "body", label: "Body & Health", icon: "🏥" },
  { code: "weather", label: "Weather", icon: "🌤️" },
  { code: "time", label: "Time & Days", icon: "🕐" },
  { code: "animals", label: "Animals", icon: "🐱" },
  { code: "clothes", label: "Clothing", icon: "👕" },
  { code: "house", label: "House & Home", icon: "🏠" },
  { code: "school", label: "School", icon: "📚" },
  { code: "work", label: "Work & Office", icon: "💼" },
  { code: "emotions", label: "Emotions", icon: "😊" },
  { code: "verbs", label: "Common Verbs", icon: "⚡" },
  { code: "adjectives", label: "Adjectives", icon: "⭐" },
  { code: "phrases", label: "Essential Phrases", icon: "💬" },
  { code: "questions", label: "Questions", icon: "❓" },
];

export function VocabVaultSection() {
  const app = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [words, setWords] = useState<VocabWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [savedSet, setSavedSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`/api/learned?language=${app.language}`)
      .then((r) => r.json())
      .then((d) => { if (d.items) setSavedSet(new Set(d.items.map((i: any) => i.item))); })
      .catch(() => {});
  }, [app.language]);

  const loadCategory = useCallback(async (catCode: string) => {
    setSelectedCategory(catCode);
    setLoading(true); setError(null); setWords([]);
    try {
      const res = await fetch("/api/vocab-vault", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: app.language, category: catCode, hintLanguage: app.hintLanguage }),
      });
      const data = await res.json();
      if (data.words?.length > 0) setWords(data.words);
      else setError("No words found. Try another category.");
    } catch { setError("Failed to load vocabulary."); }
    finally { setLoading(false); }
  }, [app.language, app.hintLanguage]);

  const handleSave = async (word: VocabWord) => {
    if (savedSet.has(word.word)) return;
    await fetch("/api/learned", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: app.language, type: "word", item: word.word, meaning: word.meaning, example: null }) });
    setSavedSet((prev) => new Set(prev).add(word.word));
  };

  const speak = async (text: string) => { await speakText(text); };
  const filtered = words.filter((w) =>
    w.word.toLowerCase().includes(search.toLowerCase()) ||
    w.meaning.toLowerCase().includes(search.toLowerCase())
  );

  if (!selectedCategory) {
    return (
      <div className="space-y-4 pb-6">
        <Card className="p-4 bg-gradient-to-br from-indigo-500 to-violet-500 text-white border-0 shadow-md">
          <div className="flex items-center gap-2">
            <Library className="h-5 w-5" />
            <div><h1 className="text-lg font-bold">Vocabulary Vault</h1>
            <p className="text-xs text-indigo-50">{CATEGORIES.length} categories · 500+ words · Smart Dictionary</p></div>
          </div>
        </Card>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {CATEGORIES.map((cat) => (
            <button key={cat.code} type="button" onClick={() => loadCategory(cat.code)}
              className="flex items-center gap-2 p-3 rounded-lg border border-stone-200 bg-white hover:border-emerald-300 hover:shadow-sm transition-all text-left">
              <span className="text-2xl">{cat.icon}</span>
              <div><div className="text-sm font-medium text-stone-800">{cat.label}</div>
              <div className="text-[10px] text-stone-400">25 words</div></div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const selectedCat = CATEGORIES.find((c) => c.code === selectedCategory);
  return (
    <div className="space-y-4 pb-6">
      <Card className="p-4 bg-gradient-to-br from-indigo-500 to-violet-500 text-white border-0 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><span className="text-2xl">{selectedCat?.icon}</span>
            <div><h1 className="text-lg font-bold">{selectedCat?.label}</h1>
            <p className="text-xs text-indigo-50">{words.length} words · {app.language} → {app.hintLanguage}</p></div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => { setSelectedCategory(null); setWords([]); setSearch(""); }}
            className="bg-white/20 text-white hover:bg-white/30 border-0">
            <ChevronLeft className="h-4 w-4 mr-1" />All Categories
          </Button>
        </div>
      </Card>
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-stone-400" />
        <Input placeholder="Search words..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-white" />
      </div>
      {loading && <Card className="p-8 text-center bg-white"><Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-500 mb-2" /><p className="text-sm text-stone-500">Loading vocabulary...</p></Card>}
      {error && !loading && <Card className="p-4 bg-rose-50 border-rose-200"><div className="flex items-center gap-2 text-rose-700"><AlertCircle className="h-4 w-4" /><span className="text-sm">{error}</span></div>
        <Button size="sm" variant="outline" className="mt-2" onClick={() => loadCategory(selectedCategory)}>Try Again</Button></Card>}
      {!loading && !error && (
        <div className="space-y-2">
          {filtered.map((w, i) => {
            const isSaved = savedSet.has(w.word);
            return (
              <Card key={i} className="p-3 bg-white flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-medium text-stone-800">{w.word}</span>
                    {w.pronunciation && <span className="text-xs text-stone-400 italic">/{w.pronunciation}/</span>}
                  </div>
                  <p className="text-sm text-stone-600 mt-0.5">{w.meaning}</p>
                </div>
                <button type="button" onClick={() => speak(w.word)} className="text-stone-400 hover:text-emerald-600 p-1 shrink-0" aria-label="Hear word">
                  <Volume2 className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => handleSave(w)} className={cn("p-1 shrink-0 transition-colors", isSaved ? "text-amber-500" : "text-stone-300 hover:text-amber-500")} aria-label="Save word">
                  <Star className={cn("h-4 w-4", isSaved && "fill-current")} />
                </button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
