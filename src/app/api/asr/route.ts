import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;
async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

// POST /api/asr
// Accepts a multipart/form-data upload with field "audio" (a WAV/webm blob
// recorded by the browser's MediaRecorder). Returns the transcribed text.
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

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));
    const base64Audio = buffer.toString("base64");

    const zai = await getZAI();
    const response = await zai.audio.asr.create({
      file_base64: base64Audio,
    });

    const text = (response?.text ?? "").trim();
    if (!text) {
      return NextResponse.json(
        { error: "Could not transcribe audio. Please try again." },
        { status: 422 }
      );
    }

    return NextResponse.json({ text });
  } catch (err) {
    console.error("/api/asr error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
