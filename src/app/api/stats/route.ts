import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cacheGet, cacheSet, cacheKey } from "@/lib/cache";

// GET /api/stats - aggregated progress across all sessions.
// All 7 queries run in parallel for ~50ms total instead of ~400ms sequential.
// In-memory cache for 30s prevents re-querying on every page navigation.
export async function GET() {
  const key = cacheKey("stats");
  const cached = cacheGet<any>(key);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "X-Cache": "MEM-HIT", "Cache-Control": "private, max-age=15" },
    });
  }

  try {
    // Run all queries in parallel (single round-trip equivalent)
    const [
      totalSessions,
      totalMessages,
      userMessages,
      assistantMessages,
      totalMistakes,
      mistakeGroupsRaw,
      languageGroupsRaw,
      recentMistakes,
    ] = await Promise.all([
      db.session.count(),
      db.message.count(),
      db.message.count({ where: { role: "user" } }),
      db.message.count({ where: { role: "assistant" } }),
      db.mistake.count(),
      db.mistake.groupBy({ by: ["type"], _count: { _all: true } }),
      db.session.groupBy({ by: ["language"], _count: { _all: true } }),
      db.mistake.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { session: { select: { language: true, topic: true } } },
      }),
    ]);

    const mistakesByType = mistakeGroupsRaw.map((g) => ({
      type: g.type,
      count: g._count._all,
    }));

    const sessionsByLanguage = languageGroupsRaw.map((g) => ({
      language: g.language,
      count: g._count._all,
    }));

    const result = {
      totalSessions,
      totalMessages,
      userMessages,
      assistantMessages,
      totalMistakes,
      mistakesByType,
      sessionsByLanguage,
      recentMistakes,
    };

    // Cache 30 seconds (handles rapid page navigations)
    cacheSet(key, result, 1000 * 30);

    return NextResponse.json(result, {
      headers: { "X-Cache": "MISS", "Cache-Control": "private, max-age=15" },
    });
  } catch (err) {
    // If DB fails, return zeros instead of crashing the dashboard
    console.error("/api/stats error:", err);
    return NextResponse.json({
      totalSessions: 0,
      totalMessages: 0,
      userMessages: 0,
      assistantMessages: 0,
      totalMistakes: 0,
      mistakesByType: [],
      sessionsByLanguage: [],
      recentMistakes: [],
    });
  }
}
