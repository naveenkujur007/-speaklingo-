import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applySrs, type ReviewQuality } from "@/lib/srs";
import { touchStreak } from "@/app/api/curriculum/route";

// GET /api/review?language=english
// Returns all review cards that are due (dueAt <= now), plus counts.
export async function GET(req: NextRequest) {
  const language = req.nextUrl.searchParams.get("language") || "english";
  const now = new Date();

  const dueReviews = await db.review.findMany({
    where: { language, dueAt: { lte: now } },
    include: { learnedItem: true },
    orderBy: { dueAt: "asc" },
    take: 50,
  });

  const totalCards = await db.review.count({ where: { language } });

  // Next due time for cards scheduled in the future
  const upcoming = await db.review.findFirst({
    where: { language, dueAt: { gt: now } },
    orderBy: { dueAt: "asc" },
  });

  return NextResponse.json({
    due: dueReviews.map((r) => ({
      id: r.id,
      ease: r.ease,
      interval: r.interval,
      repetitions: r.repetitions,
      dueAt: r.dueAt,
      learnedItem: {
        id: r.learnedItem.id,
        type: r.learnedItem.type,
        item: r.learnedItem.item,
        meaning: r.learnedItem.meaning,
        example: r.learnedItem.example,
      },
    })),
    dueCount: dueReviews.length,
    totalCards,
    nextDueAt: upcoming?.dueAt ?? null,
  });
}

// POST /api/review
// Body: { language, learnedItemId, quality: "again"|"hard"|"good"|"easy" }
// Updates the SRS state for one card.
export async function POST(req: NextRequest) {
  try {
    const { language, learnedItemId, quality } = await req.json();
    if (!language || !learnedItemId || !quality) {
      return NextResponse.json(
        { error: "language, learnedItemId, quality are required" },
        { status: 400 }
      );
    }

    const existing = await db.review.findFirst({
      where: { language, learnedItemId },
    });

    if (!existing) {
      // Auto-create the review card on first review
      const learnedItem = await db.learnedItem.findUnique({
        where: { id: learnedItemId },
      });
      if (!learnedItem) {
        return NextResponse.json(
          { error: "Learned item not found" },
          { status: 404 }
        );
      }
      const created = await db.review.create({
        data: {
          language,
          learnedItemId,
          ease: 2.5,
          interval: 0,
          repetitions: 0,
          dueAt: new Date(),
        },
      });
      // Now apply SRS update
      const next = applySrs(
        { ease: created.ease, interval: created.interval, repetitions: created.repetitions },
        quality as ReviewQuality
      );
      const updated = await db.review.update({
        where: { id: created.id },
        data: next,
      });
      await touchStreak(language);
      return NextResponse.json({ review: updated });
    }

    const next = applySrs(
      { ease: existing.ease, interval: existing.interval, repetitions: existing.repetitions },
      quality as ReviewQuality
    );
    const updated = await db.review.update({
      where: { id: existing.id },
      data: next,
    });
    await touchStreak(language);
    return NextResponse.json({ review: updated });
  } catch (err) {
    console.error("/api/review POST error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/review with action: "auto-create"
// Body: { language, learnedItemId }
// Pre-creates a review card for a newly-saved word so it shows up in the
// review queue with default SRS values (due immediately).
export async function PUT(req: NextRequest) {
  try {
    const { language, learnedItemId } = await req.json();
    if (!language || !learnedItemId) {
      return NextResponse.json(
        { error: "language, learnedItemId are required" },
        { status: 400 }
      );
    }
    const existing = await db.review.findFirst({
      where: { language, learnedItemId },
    });
    if (existing) {
      return NextResponse.json({ review: existing, alreadyExists: true });
    }
    const created = await db.review.create({
      data: {
        language,
        learnedItemId,
        ease: 2.5,
        interval: 0,
        repetitions: 0,
        dueAt: new Date(),
      },
    });
    return NextResponse.json({ review: created, alreadyExists: false });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
