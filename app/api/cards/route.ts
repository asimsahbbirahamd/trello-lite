// app/api/cards/route.ts
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

    const { columnId, title } = body as {
      columnId?: string;
      title?: string;
    };

    if (!columnId || !title) {
      return NextResponse.json(
        { error: "columnId and title are required" },
        { status: 400 }
      );
    }

    // Find current max order in this column
    const maxOrder = await prisma.card.aggregate({
      where: { columnId },
      _max: { order: true },
    });

    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    const card = await prisma.card.create({
      data: {
        title,
        columnId,
        order: nextOrder,
      },
    });

    return NextResponse.json(card);
  } catch (err) {
    console.error("Create card error:", err);
    return NextResponse.json(
      { error: "Failed to create card" },
      { status: 500 }
    );
  }
}
