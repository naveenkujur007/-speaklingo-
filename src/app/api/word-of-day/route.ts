import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import ZAI from "z-ai-web-dev-sdk";
import { LANGUAGES, type Difficulty } from "@/lib/teacher-config";

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;
async function getZAI() {
  if (!zaiInstance) zaiInstance = await ZAI.create();
  return zaiInstance;
}

interface WordOfDay {
  word: string;
  pronunciation: string;
  partOfSpeech: string;
  meaning: string; // in hint language
  example: string;
  exampleTranslation: string;
  funFact: string;
  language: string;
  date: string;
}

// GET /api/word-of-day?language=english
// Returns today's word for the given language. Generates one if none exists
// for today, then caches it in DB (re-purposing the Lesson model with a
// special topic="word-of-day" and the date as the title).
export async function GET(req: NextRequest) {
  const language = req.nextUrl.searchParams.get("language") || "english";
  const todayStr = new Date().toISOString().slice(0, 10);

  // Try to find today's cached word.
  const cached = await db.lesson.findFirst({
    where: {
      language,
      topic: "word-of-day",
      title: todayStr,
    },
  });
  if (cached) {
    try {
      const parsed = JSON.parse(cached.content) as WordOfDay;
      return NextResponse.json({ word: parsed, cached: true });
    } catch {
      // fall through
    }
  }

  // Generate a fresh word.
  const langInfo = LANGUAGES.find((l) => l.code === language);
  const langName = langInfo?.name ?? "English";

  const systemPrompt = `You are LinguaBot, an energetic ${langName} teacher. Pick ONE interesting and useful ${langName} word for the learner today. It should be a word that's commonly used but not too basic — something a learner would be excited to learn.

Respond with ONLY a valid JSON object (no markdown, no fences, no commentary) with this exact shape:
{"word":"...","pronunciation":"simple phonetic","partOfSpeech":"noun/verb/adj","meaning":"short meaning in Hindi/Hinglish","example":"a natural example sentence in ${langName}","exampleTranslation":"translation in Hindi/Hinglish","funFact":"one short interesting fact about this word or its usage in Hindi/Hinglish"}`;

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

    // Cache it
    await db.lesson.create({
      data: {
        language,
        level: "beginner",
        topic: "word-of-day",
        title: todayStr,
        content: JSON.stringify(parsed),
      },
    });

    return NextResponse.json({ word: parsed, cached: false });
  } catch (err) {
    console.error("/api/word-of-day error:", err);
    return NextResponse.json(
      { error: "Couldn't fetch word of the day." },
      { status: 500 }
    );
  }
}
