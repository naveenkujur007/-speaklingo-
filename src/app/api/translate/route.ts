import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { LANGUAGES } from "@/lib/teacher-config";

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;
async function getZAI() {
  if (!zaiInstance) zaiInstance = await ZAI.create();
  return zaiInstance;
}

// POST /api/translate
// Body: { text, from, to }
// Returns: { translation, pronunciation?, note? }
export async function POST(req: NextRequest) {
  try {
    const { text, from, to } = await req.json();
    if (!text || !from || !to) {
      return NextResponse.json(
        { error: "text, from, to are required" },
        { status: 400 }
      );
    }

    const fromInfo = LANGUAGES.find((l) => l.code === from);
    const toInfo = LANGUAGES.find((l) => l.code === to);
    const fromName = fromInfo?.name ?? from;
    const toName = toInfo?.name ?? to;

    const systemPrompt = `You are a precise translator. Translate the user's text from ${fromName} to ${toName}.

Rules:
- If the source text is in ${fromName}, translate to ${toName}.
- If the source text is already in ${toName}, translate to ${fromName} instead (auto-swap).
- Output ONLY a valid JSON object with this shape:
{"translation":"the translated text","note":"a short note in Hindi/Hinglish about usage or nuance (1 sentence, optional)"}
- No markdown, no code fences, no commentary.`;

    const zai = await getZAI();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: systemPrompt } as any,
        { role: "user", content: text } as any,
      ],
      thinking: { type: "disabled" },
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    let t = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

    let parsed: { translation: string; note?: string };
    try {
      parsed = JSON.parse(t);
    } catch {
      const m = t.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          parsed = JSON.parse(m[0]);
        } catch {
          // Fallback: use the raw text as the translation
          parsed = { translation: raw.trim() };
        }
      } else {
        parsed = { translation: raw.trim() };
      }
    }

    return NextResponse.json({
      translation: parsed.translation,
      note: parsed.note ?? null,
    });
  } catch (err) {
    console.error("/api/translate error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
