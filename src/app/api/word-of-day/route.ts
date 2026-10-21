import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getZAI } from "@/lib/zai-server";
import { LANGUAGES, type Difficulty } from "@/lib/teacher-config";
import { cacheGet, cacheSet, cacheKey } from "@/lib/cache";



interface WordOfDay {
  word: string;
  pronunciation: string;
  partOfSpeech: string;
  meaning: string;
  example: string;
  exampleTranslation: string;
  funFact: string;
  language: string;
  date: string;
}

// GET /api/word-of-day?language=english&hintLanguage=Hindi
// Returns today's word for the given language + hint language.
// 2-tier cache: in-memory (1h) → DB (per language+hintLanguage+date) → LLM.
export async function GET(req: NextRequest) {
  const language = req.nextUrl.searchParams.get("language") || "english";
  const hintLanguage = req.nextUrl.searchParams.get("hintLanguage") || "Hindi";
  const todayStr = new Date().toISOString().slice(0, 10);

  // Tier 1: in-memory cache (instant, 0ms)
  const memKey = cacheKey("wod", language, hintLanguage, todayStr);
  const mem = cacheGet<WordOfDay>(memKey);
  if (mem) {
    return NextResponse.json({ word: mem, cached: true }, {
      headers: { "X-Cache": "MEM-HIT" },
    });
  }

  // Tier 2: DB cache (1 query, ~50ms)
  const cached = await db.lesson.findFirst({
    where: {
      language,
      topic: "word-of-day",
      title: `${todayStr}::${hintLanguage}`,
    },
  });
  if (cached) {
    try {
      const parsed = JSON.parse(cached.content) as WordOfDay;
      cacheSet(memKey, parsed, 1000 * 60 * 60); // 1h mem cache
      return NextResponse.json({ word: parsed, cached: true }, {
        headers: { "X-Cache": "DB-HIT" },
      });
    } catch {
      // fall through
    }
  }

  // Tier 3: generate fresh via LLM
  const langInfo = LANGUAGES.find((l) => l.code === language);
  const langName = langInfo?.name ?? "English";

  const systemPrompt = `You are SpeakLingo, an energetic ${langName} teacher. Pick ONE interesting and useful ${langName} word for the learner today. It should be a word that's commonly used but not too basic — something a learner would be excited to learn.

Respond with ONLY a valid JSON object (no markdown, no fences, no commentary) with this exact shape:
{"word":"...","pronunciation":"simple phonetic","partOfSpeech":"noun/verb/adj","meaning":"short meaning in ${hintLanguage}","example":"a natural example sentence in ${langName}","exampleTranslation":"translation in ${hintLanguage}","funFact":"one short interesting fact about this word or its usage in ${hintLanguage}"}`;

  try {
    const zai = await getZAI();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: systemPrompt } as any,
        {
          role: "user",
          content: `Give me today's ${langName} word of the day. Output JSON only.`,
        } as any,
      ],
      thinking: { type: "disabled" },
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    let text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    let parsed: WordOfDay | null = null;
    try {
      parsed = JSON.parse(text) as WordOfDay;
    } catch {
      const m = text.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          parsed = JSON.parse(m[0]) as WordOfDay;
        } catch {
          parsed = null;
        }
      }
    }

    if (!parsed) {
      // Fallback static word so the UI never breaks
      parsed = {
        word: "serendipity",
        pronunciation: "ser-en-DIP-i-tee",
        partOfSpeech: "noun",
        meaning: "अचानक कोई अच्छी चीज़ पा लेना (happy accident)",
        example: "Meeting my old friend at the airport was pure serendipity.",
        exampleTranslation: "हवाई अड्डे पर अपने पुराने दोस्त से मिलना पूरी तरह से serendipity थी।",
        funFact: "ये शब्द 1754 में Horace Walpole ने बनाया था एक फारसी कहानी से।",
        language,
        date: todayStr,
      };
    }

    parsed.language = language;
    parsed.date = todayStr;

    // Cache in DB + memory
    await db.lesson.create({
      data: {
        language,
        level: "beginner",
        topic: "word-of-day",
        title: `${todayStr}::${hintLanguage}`,
        content: JSON.stringify(parsed),
      },
    });
    cacheSet(memKey, parsed, 1000 * 60 * 60);

    return NextResponse.json({ word: parsed, cached: false }, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (err) {
    console.error("/api/word-of-day error:", err);
    return NextResponse.json(
      { error: "Couldn't fetch word of the day." },
      { status: 500 }
    );
  }
}
