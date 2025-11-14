// app/api/columns/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Next.js 16: params is a Promise in app router API routes
type RouteContext = {
  params: Promise<{ id: string }>;
};

// ✅ UPDATE COLUMN (title / order)
export async function PUT(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { title, order } = body as {
      title?: string;
      order?: number;
    };

    if (title === undefined && order === undefined) {
      return NextResponse.json(
        { error: "Nothing to update" },
        { status: 400 }
      );
    }

    // Update the column
    await prisma.column.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(order !== undefined && { order }),
      },
    });

    // Return column with cards so frontend always has full shape
    const columnWithCards = await prisma.column.findUnique({
      where: { id },
      include: {
        cards: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(columnWithCards);
  } catch (err) {
    console.error("Error updating column:", err);
    return NextResponse.json(
      { error: "Failed to update column" },
      { status: 500 }
    );
  }
}

// 🗑️ DELETE COLUMN (and its cards)
export async function DELETE(
  _req: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Delete cards in this column (if no FK cascade)
    await prisma.card.deleteMany({
      where: { columnId: id },
    });

    // Delete the column itself
    await prisma.column.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting column:", err);
    return NextResponse.json(
      { error: "Failed to delete column" },
      { status: 500 }
    );
  }
}
