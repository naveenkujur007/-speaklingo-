import { NextRequest, NextResponse } from "next/server";



// POST /api/asr
// Accepts a multipart/form-data upload with field "audio" (a WAV/webm blob
// recorded by the browser's MediaRecorder). Returns the transcribed text.
//
// Note: NVIDIA NIM doesn't support ASR (speech-to-text). The original
// z-ai-web-dev-sdk's ASR only works from Z.ai's internal cloud. On
// Vercel/public cloud, this endpoint will return a "not supported" error.
//
// The browser-side Pronunciation feature uses the Web Speech API
// (SpeechRecognition) directly in the client, so the practice flow still
// works. This endpoint is just a fallback for non-browser recordings.
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("audio");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Audio file is required (field name: 'audio')." },
        { status: 400 }
      );
    }

    // ASR not available on public cloud — return helpful error
    return NextResponse.json(
      {
        error:
          "Server-side ASR is only available in the Z.ai cloud environment. " +
          "Use browser-native SpeechRecognition instead (the pronunciation " +
          "feature in the app uses this automatically).",
      },
      { status: 501 }
    );
  } catch (err) {
    console.error("/api/asr error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
