import { NextRequest, NextResponse } from "next/server";
import { getZAI } from "@/lib/zai-server";
import { LANGUAGES } from "@/lib/teacher-config";
import { withCache, cacheKey } from "@/lib/cache";



// Categories for the vocabulary vault
export const VOCAB_CATEGORIES = [
  { code: "greetings", label: "Greetings & Introductions", icon: "👋" },
  { code: "numbers", label: "Numbers & Counting", icon: "🔢" },
  { code: "colors", label: "Colors", icon: "🎨" },
  { code: "family", label: "Family & Relations", icon: "👨‍👩‍👧‍👦" },
  { code: "food", label: "Food & Drinks", icon: "🍽️" },
  { code: "travel", label: "Travel & Transport", icon: "✈️" },
  { code: "shopping", label: "Shopping & Money", icon: "🛍️" },
  { code: "body", label: "Body & Health", icon: "🏥" },
  { code: "weather", label: "Weather & Nature", icon: "🌤️" },
  { code: "time", label: "Time & Days", icon: "🕐" },
  { code: "animals", label: "Animals", icon: "🐱" },
  { code: "clothes", label: "Clothing", icon: "👕" },
  { code: "house", label: "House & Home", icon: "🏠" },
  { code: "school", label: "School & Education", icon: "📚" },
  { code: "work", label: "Work & Office", icon: "💼" },
  { code: "emotions", label: "Emotions & Feelings", icon: "😊" },
  { code: "verbs", label: "Common Verbs", icon: "⚡" },
  { code: "adjectives", label: "Common Adjectives", icon: "⭐" },
  { code: "phrases", label: "Essential Phrases", icon: "💬" },
  { code: "questions", label: "Questions & Responses", icon: "❓" },
];

// POST /api/vocab-vault
// Body: { language, category, hintLanguage }
// Returns 20-30 words for the given category in the target language.
// Cached aggressively (24h) — same language+category+hint returns instantly.
export async function POST(req: NextRequest) {
  try {
    const { language, category, hintLanguage } = await req.json();
    const lang = language || "english";
    const cat = category || "greetings";
    const hint = hintLanguage || "English";

    const key = cacheKey("vocab-vault", lang, cat, hint);

    const { value, cached } = await withCache(key, async () => {
      const langInfo = LANGUAGES.find((l) => l.code === lang);
      const langName = langInfo?.name ?? "English";
      const catInfo = VOCAB_CATEGORIES.find((c) => c.code === cat);
      const catLabel = catInfo?.label ?? cat;

      const systemPrompt = `You are a vocabulary teacher. Generate 25 words/phrases for the category "${catLabel}" in ${langName}.

Output ONLY a valid JSON array. Each item: {"word":"X","pronunciation":"X","meaning":"X"}
- word: in ${langName} (use native script)
- pronunciation: simple romanization/phonetic
- meaning: in ${hint} (1-3 words, short)

Rules:
- 25 items
- Start with most common/essential words
- No markdown, no code fences
- Output starts with [ and ends with ]`;

      const zai = await getZAI();
      const completion = await zai.chat.completions.create({
        messages: [
          { role: "assistant", content: systemPrompt } as any,
          { role: "user", content: `Generate 25 ${catLabel} words in ${langName}.` } as any,
        ],
        thinking: { type: "disabled" },
      });

      const raw = completion.choices[0]?.message?.content ?? "";
      let text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

      let words: { word: string; pronunciation: string; meaning: string }[];
      try {
        words = JSON.parse(text);
      } catch {
        const m = text.match(/\[[\s\S]*\]/);
        if (m) {
          try {
            words = JSON.parse(m[0]);
          } catch {
            words = [];
          }
        } else {
          words = [];
        }
      }
      return {
        category: cat,
        categoryLabel: catLabel,
        words: Array.isArray(words) ? words.slice(0, 30) : [],
      };
    });

    return NextResponse.json(value, {
      headers: cached
        ? { "X-Cache": "HIT" }
        : { "X-Cache": "MISS", "Cache-Control": "public, max-age=86400" },
    });
  } catch (err) {
    console.error("/api/vocab-vault error:", err);
    return NextResponse.json({ error: "Failed to generate vocabulary" }, { status: 500 });
  }
}

// GET /api/vocab-vault → returns categories list (instant, no LLM)
export async function GET() {
  return NextResponse.json(
    { categories: VOCAB_CATEGORIES },
    { headers: { "Cache-Control": "public, max-age=86400" } }
  );
}
