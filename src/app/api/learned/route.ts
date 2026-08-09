import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/learned?language=english
// POST /api/learned  { language, type, item, meaning, example? }
// DELETE /api/learned?id=xxx
export async function GET(req: NextRequest) {
  const language = req.nextUrl.searchParams.get("language");
  const where = language ? { language } : {};
  const items = await db.learnedItem.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { language, type, item, meaning, example } = body;
    if (!language || !type || !item || !meaning) {
      return NextResponse.json(
        { error: "language, type, item, meaning are required." },
        { status: 400 }
      );
    }
    // Avoid duplicate stars for the same (language, item).
    const existing = await db.learnedItem.findFirst({
      where: { language, item },
    });
    if (existing) {
      return NextResponse.json({ item: existing, alreadyExists: true });
    }
    const created = await db.learnedItem.create({
      data: {
        language,
        type,
        item,
        meaning,
        example: example || null,
        starred: true,
      },
    });
    // Auto-create a review card so it shows up in the SRS queue.
    await db.review.create({
      data: {
        language,
        learnedItemId: created.id,
        ease: 2.5,
        interval: 0,
        repetitions: 0,
        dueAt: new Date(),
      },
    }).catch(() => {});
    return NextResponse.json({ item: created });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  await db.learnedItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
