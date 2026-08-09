import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurriculum, getAllCurriculumNodes } from "@/lib/curriculum";

// GET /api/curriculum?language=english
// Returns the curriculum tree + the learner's progress per node.
export async function GET(req: NextRequest) {
  const language = req.nextUrl.searchParams.get("language") || "english";
  const curriculum = getCurriculum(language);
  if (!curriculum) {
    return NextResponse.json(
      { error: `No curriculum found for language: ${language}` },
      { status: 404 }
    );
  }

  const progress = await db.progress.findMany({
    where: { language },
  });
  const progressMap = new Map(progress.map((p) => [p.nodeId, p]));

  // Compute unlock status. A node is "available" if:
  // - it's the very first node in the curriculum, OR
  // - the previous node (by order across all levels) is "completed".
  const allNodes = getAllCurriculumNodes(language);
  const enrichedLevels = curriculum.levels.map((lvl) => ({
    ...lvl,
    nodes: lvl.nodes.map((node) => {
      const p = progressMap.get(node.id);
      const nodeIndex = allNodes.findIndex((n) => n.id === node.id);
      const prevNode = nodeIndex > 0 ? allNodes[nodeIndex - 1] : null;
      const prevProgress = prevNode ? progressMap.get(prevNode.id) : null;

      let status: string;
      if (p?.status === "completed") {
        status = "completed";
      } else if (p?.status === "in-progress") {
        status = "in-progress";
      } else if (!prevNode || prevProgress?.status === "completed") {
        status = "available";
      } else {
        status = "locked";
      }

      return {
        ...node,
        status,
        score: p?.score ?? null,
        completedAt: p?.completedAt ?? null,
      };
    }),
  }));

  return NextResponse.json({
    curriculum: { ...curriculum, levels: enrichedLevels },
    totalNodes: allNodes.length,
    completedCount: progress.filter((p) => p.status === "completed").length,
  });
}

// POST /api/curriculum
// Body: { language, nodeId, action: "start" | "complete", score? }
// Marks a node as in-progress or completed. On complete, awards achievements.
export async function POST(req: NextRequest) {
  try {
    const { language, nodeId, action, score } = await req.json();
    if (!language || !nodeId || !action) {
      return NextResponse.json(
        { error: "language, nodeId, action are required" },
        { status: 400 }
      );
    }

    const status = action === "complete" ? "completed" : "in-progress";
    const completedAt = action === "complete" ? new Date() : null;

    const progress = await db.progress.upsert({
      where: { language_nodeId: { language, nodeId } },
      update: {
        status,
        ...(score !== undefined ? { score } : {}),
        ...(completedAt ? { completedAt } : {}),
      },
      create: {
        language,
        nodeId,
        status,
        score: score ?? null,
        completedAt,
      },
    });

    // Touch the streak for today.
    await touchStreak(language);

    // Award achievements if this is a completion.
    const earned: string[] = [];
    if (action === "complete") {
      const completedCount = await db.progress.count({
        where: { language, status: "completed" },
      });
      if (completedCount >= 1) earned.push("first-lesson");
      if (completedCount >= 5) earned.push("five-lessons");
      if (completedCount >= 10) earned.push("ten-lessons");
      if (typeof score === "number" && score >= 100) {
        earned.push("first-quiz-perfect");
      }
      for (const code of earned) {
        await db.achievement.upsert({
          where: { code_language: { code, language } },
          update: {},
          create: { code, language },
        });
      }
    }

    return NextResponse.json({ progress, earnedAchievements: earned });
  } catch (err) {
    console.error("/api/curriculum POST error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Shared helper: bump the streak for the given language for today.
export async function touchStreak(language: string) {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const existing = await db.streak.findUnique({ where: { language } });

  if (!existing) {
    await db.streak.create({
      data: {
        language,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: todayStr,
        totalActiveDays: 1,
      },
    });
    return { currentStreak: 1, isNew: true };
  }

  if (existing.lastActiveDate === todayStr) {
    // Already counted today.
    return { currentStreak: existing.currentStreak, isNew: false };
  }

  const isConsecutive = existing.lastActiveDate === yesterdayStr;
  const newCurrent = isConsecutive ? existing.currentStreak + 1 : 1;
  const newLongest = Math.max(existing.longestStreak, newCurrent);
  const newTotal = existing.totalActiveDays + 1;

  await db.streak.update({
    where: { language },
    data: {
      currentStreak: newCurrent,
      longestStreak: newLongest,
      lastActiveDate: todayStr,
      totalActiveDays: newTotal,
    },
  });

  // Streak-based achievements
  const earned: string[] = [];
  if (newCurrent >= 3) earned.push("3-day-streak");
  if (newCurrent >= 7) earned.push("7-day-streak");
  if (newCurrent >= 30) earned.push("30-day-streak");
  for (const code of earned) {
    await db.achievement.upsert({
      where: { code_language: { code, language } },
      update: {},
      create: { code, language },
    });
  }

  return { currentStreak: newCurrent, isNew: true, earnedAchievements: earned };
}
