// app/api/columns/route.ts
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

    const { boardId, title } = body as {
      boardId?: string;
      title?: string;
    };

    if (!boardId) {
      return NextResponse.json(
        { error: "boardId is required" },
        { status: 400 }
      );
    }

    const safeTitle = (title ?? "").trim() || "Untitled";

    // Find next order within this board
    const maxOrder = await prisma.column.findFirst({
      where: { boardId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const column = await prisma.column.create({
      data: {
        title: safeTitle,
        order: (maxOrder?.order ?? 0) + 1,
        boardId,
      },
    });

    return NextResponse.json(column, { status: 201 });
  } catch (err) {
    console.error("Error creating column:", err);
    return NextResponse.json(
      { error: "Failed to create column" },
      { status: 500 }
    );
  }
}
