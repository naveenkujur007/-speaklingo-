import { NextRequest, NextResponse } from "next/server";



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
// Returns audio/wav binary.
//
// Note: NVIDIA NIM doesn't have TTS. The original z-ai-web-dev-sdk's TTS
// only works from Z.ai's internal cloud. On Vercel/public cloud, this
// endpoint returns a "not supported" error so the frontend can fall back
// to /api/tts-proxy (Google Translate TTS) or browser SpeechSynthesis.
//
// The frontend's speak.ts already implements this fallback chain:
//   1. Try native browser SpeechSynthesis (instant, free)
//   2. Try /api/tts-proxy (Google Translate proxy, free, professional voice)
//   3. Try /api/tts (this endpoint — now 501)
export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

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

    // TTS not available on public cloud — return helpful 501
    return new NextResponse(
      JSON.stringify({
        error:
          "Server-side TTS is only available in the Z.ai cloud environment. " +
          "Use /api/tts-proxy (Google Translate proxy) or browser SpeechSynthesis instead.",
      }),
      {
        status: 501,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("/api/tts error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
