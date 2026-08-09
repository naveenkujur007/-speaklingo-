import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import ZAI from "z-ai-web-dev-sdk";
import { scorePronunciation } from "@/lib/pronunciation";
import { touchStreak } from "@/app/api/curriculum/route";

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;
async function getZAI() {
  if (!zaiInstance) zaiInstance = await ZAI.create();
  return zaiInstance;
}

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

    const zai = await getZAI();
    const asrResponse = await zai.audio.asr.create({
      file_base64: base64Audio,
    });
    const transcribed = (asrResponse?.text ?? "").trim();

    if (!transcribed) {
      return NextResponse.json(
        {
          error: "Couldn't hear you clearly. Please try again, a bit louder.",
        },
        { status: 422 }
      );
    }

    const result = scorePronunciation(targetText, transcribed);

    // Save the attempt for history.
    const attempt = await db.pronunciationAttempt.create({
      data: {
        language,
        targetText,
        transcribed,
        score: result.score,
        phonemeNotes: JSON.stringify({
          missedWords: result.missedWords,
          extraWords: result.extraWords,
        }),
      },
    });

    // Touch streak + achievements
    const streakResult = await touchStreak(language);
    const earned: string[] = ["first-pronunciation"];
    if (result.score >= 90) earned.push("pronunciation-90");
    for (const code of earned) {
      await db.achievement.upsert({
        where: { code_language: { code, language } },
        update: {},
        create: { code, language },
      });
    }

    return NextResponse.json({
      attemptId: attempt.id,
      ...result,
      earnedAchievements: earned,
    });
  } catch (err) {
    console.error("/api/pronunciation error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
