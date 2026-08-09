import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;
async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

// Split long text into chunks of <= 1000 chars, breaking on sentence
// boundaries when possible. TTS API has a 1024-char limit per request.
function splitTextIntoChunks(text: string, maxLength = 1000): string[] {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed ? [trimmed] : [];

  const chunks: string[] = [];
  const sentences = trimmed.match(/[^.!?]+[.!?]+|\S[^.!?]*$/g) ?? [trimmed];
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length <= maxLength) {
      current += sentence;
    } else {
      if (current) chunks.push(current.trim());
      if (sentence.length <= maxLength) {
        current = sentence;
      } else {
        // Hard split very long sentence
        for (let i = 0; i < sentence.length; i += maxLength) {
          chunks.push(sentence.slice(i, i + maxLength).trim());
        }
        current = "";
      }
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// POST /api/tts
// Body: { text: string, voice?: string, speed?: number }
// Returns audio/wav binary. For long text we only synthesize the first chunk
// to keep latency low for a conversational UI; the frontend can request
// additional chunks if needed.
export async function POST(req: NextRequest) {
  try {
    const { text, voice = "tongtong", speed = 1.0 } = await req.json();

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "Text is required." },
        { status: 400 }
      );
    }

    const chunks = splitTextIntoChunks(text, 1000);
    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "Text is empty after trimming." },
        { status: 400 }
      );
    }

    const zai = await getZAI();
    const firstChunk = chunks[0];

    const response = await zai.audio.tts.create({
      input: firstChunk,
      voice,
      speed,
      response_format: "wav",
      stream: false,
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("/api/tts error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
