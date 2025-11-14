import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const boards = await prisma.board.findMany({
    include: {
      columns: {
        include: {
          cards: true,
        },
        orderBy: { order: "asc" },
      },
    },
  });

  return NextResponse.json(boards);
}

export async function POST(req: Request) {
  const { title } = await req.json();

  const board = await prisma.board.create({
    data: {
      title,
      columns: {
        create: [
          { title: "To Do", order: 0 },
          { title: "In Progress", order: 1 },
          { title: "Done", order: 2 },
        ],
      },
    },
  });

  return NextResponse.json(board);
}
