// app/api/cards/reorder/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { columnId, orderedIds } = body as {
      columnId?: string;
      orderedIds?: string[];
    };

    if (!columnId || !Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: "columnId and orderedIds[] are required" },
        { status: 400 }
      );
    }

    await Promise.all(
      orderedIds.map((id, index) =>
        prisma.card.update({
          where: { id },
          data: {
            columnId,
            order: index,
          },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error reordering cards:", err);
    return NextResponse.json(
      { error: "Failed to reorder cards" },
      { status: 500 }
    );
  }
}
