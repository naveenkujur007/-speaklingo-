import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getZAI } from "@/lib/zai-server";
import { scorePronunciation } from "@/lib/pronunciation";
import { touchStreak } from "@/app/api/curriculum/route";



// POST /api/pronunciation
// FormData with: audio (blob), targetText (string), language (string)
// Transcribes the audio via ASR, compares against targetText, returns a score.
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("audio");
    const targetText = formData.get("targetText");
    const language = (formData.get("language") as string) || "english";

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Audio file is required (field: 'audio')." },
        { status: 400 }
      );
    }
    if (!targetText || typeof targetText !== "string") {
      return NextResponse.json(
        { error: "targetText is required." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));
    const base64Audio = buffer.toString("base64");

    // ASR not available on public cloud (NVIDIA NIM doesn't have ASR;
    // z-ai-web-dev-sdk's ASR only works in Z.ai's internal cloud).
    // Return helpful 501 — the browser-side pronunciation practice uses
    // Web Speech API (SpeechRecognition) instead, which works everywhere.
    return NextResponse.json(
      {
        error:
          "Server-side ASR is only available in the Z.ai cloud environment. " +
          "The app's pronunciation practice uses browser-native SpeechRecognition.",
      },
      { status: 501 }
    );
  } catch (err) {
    console.error("/api/pronunciation error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
