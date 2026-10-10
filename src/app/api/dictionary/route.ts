import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { LANGUAGES } from "@/lib/teacher-config";

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;
async function getZAI() {
  if (!zaiInstance) zaiInstance = await ZAI.create();
  return zaiInstance;
}

// POST /api/dictionary
// Body: { word, language, hintLanguage }
// Returns full dictionary entry for the word in target language
export async function POST(req: NextRequest) {
  try {
    const { word, language, hintLanguage } = await req.json();
    if (!word || !word.trim()) {
      return NextResponse.json({ error: "Word is required" }, { status: 400 });
    }

    const lang = language || "english";
    const hint = hintLanguage || "English";
    const langInfo = LANGUAGES.find((l) => l.code === lang);
    const langName = langInfo?.name ?? "English";

    const systemPrompt = `You are a dictionary for ${langName}. The user gives you a word. Return a complete dictionary entry.

Output ONLY valid JSON (no markdown, no code fences):
{"word":"the word","pronunciation":"phonetic","partOfSpeech":"noun/verb/adj/etc","meaning":"short meaning in ${hint}","definition":"longer definition in ${hint}","examples":["3 example sentences in ${langName}"],"exampleTranslations":["translations in ${hint}"],"synonyms":["2-3 synonyms in ${langName}"],"antonyms":["2-3 antonyms in ${langName}"],"related":["2-3 related words in ${langName} with short meaning in ${hint}"]}`;

    const zai = await getZAI();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: systemPrompt } as any,
        { role: "user", content: `Look up the word: "${word.trim()}" in ${langName}.` } as any,
      ],
      thinking: { type: "disabled" },
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

    try {
      const parsed = JSON.parse(text);
      return NextResponse.json({ entry: parsed });
    } catch {
      const m = text.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          const parsed = JSON.parse(m[0]);
          return NextResponse.json({ entry: parsed });
        } catch {
          return NextResponse.json({ error: "Couldn't look up that word." }, { status: 502 });
        }
      }
      return NextResponse.json({ error: "Dictionary lookup failed." }, { status: 502 });
    }
  } catch (err) {
    console.error("/api/dictionary error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
