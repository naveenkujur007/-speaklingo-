import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import ZAI from "z-ai-web-dev-sdk";
import {
  buildLessonSystemPrompt,
  extractLessonJson,
  type Difficulty,
  type Lesson,
} from "@/lib/teacher-config";

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;
async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

// GET /api/lesson?language=english&level=beginner&topic=daily-life
// Returns the most recent saved lesson for the given config, or null.
export async function GET(req: NextRequest) {
  const language = req.nextUrl.searchParams.get("language") || "english";
  const level = req.nextUrl.searchParams.get("level") || "beginner";
  const topic = req.nextUrl.searchParams.get("topic") || "daily-life";

  const recent = await db.lesson.findFirst({
    where: { language, level, topic },
    orderBy: { createdAt: "desc" },
  });

  if (!recent) {
    return NextResponse.json({ lesson: null });
  }
  try {
    const parsed = JSON.parse(recent.content) as Lesson;
    return NextResponse.json({ lesson: parsed, savedId: recent.id, savedAt: recent.createdAt });
  } catch {
    return NextResponse.json({ lesson: null });
  }
}

// POST /api/lesson
// Body: { language, level, topic, regenerate?: boolean }
// Generates a fresh lesson via LLM, saves it to DB, returns it.
export async function POST(req: NextRequest) {
  try {
    const { language, level, topic, regenerate, hintLanguage } = await req.json();
    const lang = language || "english";
    const lvl: Difficulty = (level as Difficulty) || "beginner";
    const tp = topic || "daily-life";
    const hint = hintLanguage || "English";

    // If not explicitly regenerating, try to return today's existing lesson.
    if (!regenerate) {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const todays = await db.lesson.findFirst({
        where: { language: lang, level: lvl, topic: tp, createdAt: { gte: startOfToday } },
        orderBy: { createdAt: "desc" },
      });
      if (todays) {
        try {
          const parsed = JSON.parse(todays.content) as Lesson;
          return NextResponse.json({
            lesson: parsed,
            savedId: todays.id,
            savedAt: todays.createdAt,
            cached: true,
          });
        } catch {
          // fall through to regeneration
        }
      }
    }

    const systemPrompt = buildLessonSystemPrompt({
      language: lang,
      level: lvl,
      topic: tp,
      hintLanguage: hint,
    });

    const zai = await getZAI();

    // Single attempt with concise prompt — no retries for speed
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: systemPrompt } as any,
        { role: "user", content: `Generate the lesson now. Output ONLY JSON.` } as any,
      ],
      thinking: { type: "disabled" },
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const lesson = extractLessonJson(raw);

    if (!lesson || (!lesson.vocabulary?.length && !lesson.quiz?.length)) {
      // Return a minimal fallback lesson immediately — don't retry
      const fallback: Lesson = {
        language: lang, level: lvl, topic: tp,
        title: `${tp} lesson`,
        intro: `Welcome to today's ${lang} lesson!`,
        vocabulary: [], grammar: { title: "Grammar", rule: "", structure: "", examples: [], commonMistakes: [] },
        phrases: [], sentenceBuilding: [], conversation: [], pronunciation: [], culture: [],
        quiz: [], homework: "Practice what you've learned today!",
      };
      return NextResponse.json({ lesson: fallback, cached: false, warning: "Try regenerating for full content." });
    }

    // Defensive: normalize all arrays so UI never crashes
    lesson.vocabulary = Array.isArray(lesson.vocabulary) ? lesson.vocabulary : [];
    lesson.phrases = Array.isArray(lesson.phrases) ? lesson.phrases : [];
    lesson.quiz = Array.isArray(lesson.quiz) ? lesson.quiz : [];
    lesson.sentenceBuilding = Array.isArray(lesson.sentenceBuilding) ? lesson.sentenceBuilding : [];
    lesson.conversation = Array.isArray(lesson.conversation) ? lesson.conversation : [];
    lesson.pronunciation = Array.isArray(lesson.pronunciation) ? lesson.pronunciation : [];
    lesson.culture = Array.isArray(lesson.culture) ? lesson.culture : [];
    lesson.grammar = lesson.grammar ?? { title: "Grammar", rule: "", structure: "", examples: [], commonMistakes: [] };
    lesson.grammar.examples = Array.isArray(lesson.grammar.examples) ? lesson.grammar.examples : [];
    lesson.grammar.commonMistakes = Array.isArray(lesson.grammar.commonMistakes) ? lesson.grammar.commonMistakes : [];

    const saved = await db.lesson.create({
      data: {
        language: lang,
        level: lvl,
        topic: tp,
        title: lesson.title || `${lang}-${tp}-${lvl}`,
        content: JSON.stringify(lesson),
      },
    });

    return NextResponse.json({
      lesson,
      savedId: saved.id,
      savedAt: saved.createdAt,
      cached: false,
    });
  } catch (err) {
    console.error("/api/lesson error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
