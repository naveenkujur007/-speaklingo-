import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getZAI } from "@/lib/zai-server";
import { LANGUAGES, type Difficulty } from "@/lib/teacher-config";
import { cacheGet, cacheSet, cacheKey } from "@/lib/cache";

// Fallback word pool (used instantly while LLM generates in background)
const FALLBACK_WORDS: Record<string, Array<{ word: string; pronunciation: string; partOfSpeech: string; meaning: string; example: string; exampleTranslation: string; funFact: string }>> = {
  english: [
    { word: "serendipity", pronunciation: "ser-en-DIP-i-tee", partOfSpeech: "noun", meaning: "अचानक कोई अच्छी चीज़ पा लेना", example: "Meeting my old friend at the airport was pure serendipity.", exampleTranslation: "हवाई अड्डे पर पुराने दोस्त से मिलना serendipity थी।", funFact: "ये शब्द 1754 में Horace Walpole ने बनाया था।" },
    { word: "ephemeral", pronunciation: "eh-FEM-er-al", partOfSpeech: "adj", meaning: "क्षणिक, थोड़े समय के लिए", example: "Rainbows are ephemeral — they last only minutes.", exampleTranslation: "इंद्रधनुष क्षणिक होते हैं।", funFact: "यूनानी भाषा से आया है — 'ephemeros' मतलब 'एक दिन का'।" },
    { word: "resilient", pronunciation: "ri-ZIL-yent", partOfSpeech: "adj", meaning: "लचीला, फिर उठने वाला", example: "Children are remarkably resilient after setbacks.", exampleTranslation: "बच्चे असफलताओं के बाद फिर उठ जाते हैं।", funFact: "लैटिन 'resilire' से — मतलब 'वापस उछलना'।" },
    { word: "nostalgia", pronunciation: "nos-TAL-ja", partOfSpeech: "noun", meaning: "पुरानी यादों का मीठा अहसास", example: "Hearing that old song filled me with nostalgia.", exampleTranslation: "पुराना गाना सुनकर nostalgia हो गई।", funFact: "यूनानी 'nostos' (घर लौटना) + 'algos' (दर्द)।" },
    { word: "eloquent", pronunciation: "EL-oh-kwent", partOfSpeech: "adj", meaning: "वाक्पटु, प्रभावी बोलने वाला", example: "She gave an eloquent speech that moved everyone.", exampleTranslation: "उसने बहुत प्रभावी भाषण दिया।", funFact: "लैटिन 'eloqui' — मतलब 'बाहर बोलना'।" },
    { word: "ambivalent", pronunciation: "am-BIV-uh-lent", partOfSpeech: "adj", meaning: "मिश्रित भावनाओं वाला", example: "I'm ambivalent about moving to a new city.", exampleTranslation: "मैं नए शहर में जाने पर ambivalent हूँ।", funFact: "जर्मन 'ambivalenz' से — दोहरा मूल्य।" },
  ],
  hindi: [
    { word: "अनुभूति", pronunciation: "anu-BHOO-ti", partOfSpeech: "noun", meaning: "Feeling / realization (in English)", example: "मेरी अनुभूति सच निकली।", exampleTranslation: "My realization came true.", funFact: "संस्कृत 'अनुभू' धातु से बना।" },
    { word: "विश्राम", pronunciation: "vish-RAM", partOfSpeech: "noun", meaning: "Rest / relaxation (in English)", example: "काम के बाद विश्राम ज़रूरी है।", exampleTranslation: "Rest after work is essential.", funFact: "'वि' + 'श्रम' — श्रम से आराम।" },
  ],
};

export interface WordOfDay {
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
// Returns today's word — instant if cached, fallback if not, generates
// in background and caches for next request.
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

  // Tier 2: DB cache (1 query, ~50ms with SQLite)
  try {
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
        cacheSet(memKey, parsed, 1000 * 60 * 60);
        return NextResponse.json({ word: parsed, cached: true }, {
          headers: { "X-Cache": "DB-HIT" },
        });
      } catch {
        // fall through
      }
    }
  } catch {
    // DB error — fall through to fallback
  }

  // Tier 3: return a fallback word INSTANTLY, generate via LLM in background.
  // User gets immediate response, next visit will get the LLM-generated word.
  const fallbackPool = FALLBACK_WORDS[language] || FALLBACK_WORDS.english;
  // Use date as deterministic seed — same word all day
  const dateNum = parseInt(todayStr.replace(/-/g, ""), 10);
  const fallbackWord = fallbackPool[dateNum % fallbackPool.length];
  const fallbackParsed: WordOfDay = {
    ...fallbackWord,
    language,
    date: todayStr,
  };

  // Cache the fallback so user doesn't see it flicker
  cacheSet(memKey, fallbackParsed, 1000 * 60 * 60); // 1h mem cache

  // Generate LLM word in background — fire and forget, save to DB.
  // Next time user refreshes, they'll get the LLM version.
  (async () => {
    try {
      const langInfo = LANGUAGES.find((l) => l.code === language);
      const langName = langInfo?.name ?? "English";

      const systemPrompt = `You are SpeakLingo, an energetic ${langName} teacher. Pick ONE interesting and useful ${langName} word for the learner today. It should be a word that's commonly used but not too basic — something a learner would be excited to learn.

Respond with ONLY a valid JSON object (no markdown, no fences, no commentary) with this exact shape:
{"word":"...","pronunciation":"simple phonetic","partOfSpeech":"noun/verb/adj","meaning":"short meaning in ${hintLanguage}","example":"a natural example sentence in ${langName}","exampleTranslation":"translation in ${hintLanguage}","funFact":"one short interesting fact about this word or its usage in ${hintLanguage}"}`;

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
        max_tokens: 500,
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

      if (parsed) {
        parsed.language = language;
        parsed.date = todayStr;

        // Save to DB (will be used on next visit)
        try {
          await db.lesson.create({
            data: {
              language,
              level: "beginner",
              topic: "word-of-day",
              title: `${todayStr}::${hintLanguage}`,
              content: JSON.stringify(parsed),
            },
          });
          // Update memory cache so subsequent requests get the LLM version
          cacheSet(memKey, parsed, 1000 * 60 * 60);
        } catch {}
      }
    } catch (err) {
      console.error("/api/word-of-day background gen error:", err);
    }
  })();

  return NextResponse.json({ word: fallbackParsed, cached: false, fallback: true }, {
    headers: { "X-Cache": "FALLBACK" },
  });
}
