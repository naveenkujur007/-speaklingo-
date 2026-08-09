import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { touchStreak } from "@/app/api/curriculum/route";

// GET /api/streak?language=english
export async function GET(req: NextRequest) {
  const language = req.nextUrl.searchParams.get("language") || "english";
  const streak = await db.streak.findUnique({ where: { language } });

  if (!streak) {
    return NextResponse.json({
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      totalActiveDays: 0,
      practicedToday: false,
    });
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  return NextResponse.json({
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastActiveDate: streak.lastActiveDate,
    totalActiveDays: streak.totalActiveDays,
    practicedToday: streak.lastActiveDate === todayStr,
  });
}

// POST /api/streak  { language }
// Manually touches today's streak (e.g. when starting a practice session).
export async function POST(req: NextRequest) {
  try {
    const { language } = await req.json();
    if (!language) {
      return NextResponse.json({ error: "language is required" }, { status: 400 });
    }
    const result = await touchStreak(language);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
