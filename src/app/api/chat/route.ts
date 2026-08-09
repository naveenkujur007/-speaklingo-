import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import ZAI from "z-ai-web-dev-sdk";
import {
  buildTeacherSystemPrompt,
  parseTeacherOutput,
  type ChatMessage,
  type Difficulty,
} from "@/lib/teacher-config";

// In-memory SDK singleton (re-use across requests).
let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;
async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

interface ChatRequestBody {
  sessionId?: string;
  message: string;
  history?: ChatMessage[];
  language?: string;
  level?: Difficulty;
  topic?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const message = (body.message || "").trim();
    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const language = body.language || "english";
    const level: Difficulty = (body.level as Difficulty) || "beginner";
    const topic = body.topic || "daily-life";

    // 1. Resolve or create a session
    let session = body.sessionId
      ? await db.session.findUnique({ where: { id: body.sessionId } })
      : null;
    if (!session) {
      session = await db.session.create({
        data: {
          language,
          level,
          topic,
          title: `${language}-${topic}-${level}`,
        },
      });
    }

    // 2. Persist the user message
    await db.message.create({
      data: { sessionId: session.id, role: "user", content: message },
    });

    // 3. Build LLM messages (system + recent history + current user msg)
    const history = body.history ?? [];
    const recentHistory = history.slice(-8); // last 8 turns to keep token budget small

    const systemPrompt = buildTeacherSystemPrompt({
      language,
      level,
      topic,
      hintLanguage: "Hindi/Hinglish",
    });

    const llmMessages: { role: string; content: string }[] = [
      { role: "assistant", content: systemPrompt },
      ...recentHistory.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    // 4. Call LLM
    const zai = await getZAI();
    const completion = await zai.chat.completions.create({
      messages: llmMessages as any,
      thinking: { type: "disabled" },
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const { reply, corrections } = parseTeacherOutput(raw);

    // 5. Persist the assistant reply
    await db.message.create({
      data: { sessionId: session.id, role: "assistant", content: reply },
    });

    // 6. Persist any mistakes for the progress dashboard
    if (corrections.length > 0) {
      await db.mistake.createMany({
        data: corrections.map((c) => ({
          sessionId: session.id,
          original: c.original,
          corrected: c.corrected,
          type: c.type,
          explanation: c.explanation,
        })),
      });
    }

    return NextResponse.json({
      sessionId: session.id,
      reply,
      corrections,
      shouldSpeak: true,
    });
  } catch (err) {
    console.error("/api/chat error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  // List recent sessions for the dashboard.
  const sessions = await db.session.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      _count: { select: { messages: true, mistakes: true } },
    },
  });
  return NextResponse.json({ sessions });
}
