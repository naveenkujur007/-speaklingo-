import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/stats - aggregated progress across all sessions.
export async function GET() {
  const totalSessions = await db.session.count();
  const totalMessages = await db.message.count();
  const userMessages = await db.message.count({ where: { role: "user" } });
  const assistantMessages = await db.message.count({
    where: { role: "assistant" },
  });
  const totalMistakes = await db.mistake.count();

  // Mistakes grouped by type
  const mistakeGroupsRaw = await db.mistake.groupBy({
    by: ["type"],
    _count: { _all: true },
  });
  const mistakesByType = mistakeGroupsRaw.map((g) => ({
    type: g.type,
    count: g._count._all,
  }));

  // Sessions grouped by language
  const languageGroupsRaw = await db.session.groupBy({
    by: ["language"],
    _count: { _all: true },
  });
  const sessionsByLanguage = languageGroupsRaw.map((g) => ({
    language: g.language,
    count: g._count._all,
  }));

  // Recent 10 mistakes (for the dashboard "recent corrections" feed)
  const recentMistakes = await db.mistake.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { session: { select: { language: true, topic: true } } },
  });

  return NextResponse.json({
    totalSessions,
    totalMessages,
    userMessages,
    assistantMessages,
    totalMistakes,
    mistakesByType,
    sessionsByLanguage,
    recentMistakes,
  });
}
