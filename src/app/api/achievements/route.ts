import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ACHIEVEMENTS } from "@/lib/curriculum";

// GET /api/achievements?language=english
// Returns all achievement definitions with earned status.
export async function GET(req: NextRequest) {
  const language = req.nextUrl.searchParams.get("language") || "english";

  const earned = await db.achievement.findMany({
    where: { language },
    orderBy: { earnedAt: "desc" },
  });
  const earnedMap = new Map(earned.map((a) => [a.code, a.earnedAt]));

  const list = ACHIEVEMENTS.map((def) => ({
    ...def,
    earned: earnedMap.has(def.code),
    earnedAt: earnedMap.get(def.code) ?? null,
  }));

  return NextResponse.json({
    achievements: list,
    earnedCount: earned.length,
    totalCount: ACHIEVEMENTS.length,
  });
}

// POST /api/achievements
// Body: { code, language } - manually award an achievement (used by chat/practice).
export async function POST(req: NextRequest) {
  try {
    const { code, language } = await req.json();
    if (!code || !language) {
      return NextResponse.json(
        { error: "code, language are required" },
        { status: 400 }
      );
    }
    const created = await db.achievement.upsert({
      where: { code_language: { code, language } },
      update: {},
      create: { code, language },
    });
    return NextResponse.json({ achievement: created, isNew: created.earnedAt === created.earnedAt });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
