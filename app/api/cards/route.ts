// app/api/cards/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { columnId, title } = await req.json();

    if (!columnId || !title) {
      return NextResponse.json(
        { error: "columnId and title are required" },
        { status: 400 }
      );
    }

    // Find next order in this column
    const maxOrder = await prisma.card.findFirst({
      where: { columnId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const card = await prisma.card.create({
      data: {
        title,
        body: "",
        order: (maxOrder?.order ?? 0) + 1,
        columnId,
      },
    });

    // ✅ Always return JSON
    return NextResponse.json(card, { status: 201 });
  } catch (err) {
    console.error("Card create error:", err);
    return NextResponse.json(
      { error: "Failed to create card" },
      { status: 500 }
    );
  }
}
