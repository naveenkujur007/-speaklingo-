import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/sessions            - list recent sessions
// GET /api/sessions?id=xxx     - get one session with messages + mistakes
// DELETE /api/sessions?id=xxx  - delete a session
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (id) {
    const session = await db.session.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        mistakes: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ session });
  }

  const sessions = await db.session.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: { _count: { select: { messages: true, mistakes: true } } },
  });
  return NextResponse.json({ sessions });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  await db.session.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
