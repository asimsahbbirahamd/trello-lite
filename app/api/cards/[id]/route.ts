// app/api/cards/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// ✅ UPDATE CARD (title / order / columnId)
export async function PUT(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { title, order, columnId } = body as {
      title?: string;
      order?: number;
      columnId?: string;
    };

    if (
      title === undefined &&
      order === undefined &&
      columnId === undefined
    ) {
      return NextResponse.json(
        { error: "Nothing to update" },
        { status: 400 }
      );
    }

    const card = await prisma.card.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(order !== undefined && { order }),
        ...(columnId !== undefined && { columnId }),
      },
    });

    return NextResponse.json(card);
  } catch (err) {
    console.error("Error updating card:", err);
    return NextResponse.json(
      { error: "Failed to update card" },
      { status: 500 }
    );
  }
}

// 🗑️ DELETE CARD
export async function DELETE(
  _req: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    await prisma.card.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete card error:", err);
    return NextResponse.json(
      { error: "Failed to delete card" },
      { status: 500 }
    );
  }
}
