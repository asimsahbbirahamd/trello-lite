"use client";

import { useEffect, useState } from "react";
import Column from "./Column";

interface CardType {
  id: string;
  title: string;
  order: number;
  columnId: string;
  body?: string | null;
}

interface ColumnType {
  id: string;
  title: string;
  order: number;
  boardId: string;
  cards?: CardType[];
}

interface BoardType {
  id: string;
  title: string;
  columns: ColumnType[];
}

export default function Board() {
  const [board, setBoard] = useState<BoardType | null>(null);

  useEffect(() => {
    fetch("/api/boards")
      .then((res) => res.json())
      .then((data) => {
        const first = data[0];
        // ensure cards arrays exist
        first.columns = first.columns.map((col: ColumnType) => ({
          ...col,
          cards: col.cards ?? [],
        }));
        setBoard(first);
      });
  }, []);

  if (!board) {
    return <p className="p-6 text-gray-500">Loading board…</p>;
  }

  async function addColumn() {
    const res = await fetch("/api/columns", {
      method: "POST",
      body: JSON.stringify({
        boardId: board.id,
        title: "Untitled",
      }),
    });

    if (!res.ok) {
      console.error("Failed to create column", await res.text());
      return;
    }

    const newColumn = (await res.json()) as ColumnType;

    setBoard((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        columns: [
          ...prev.columns,
          { ...newColumn, cards: [] },
        ],
      };
    });
  }

  function updateColumn(updated: ColumnType) {
    setBoard((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        columns: prev.columns.map((col) =>
          col.id === updated.id
            ? {
                ...col,
                ...updated,
                cards: updated.cards ?? col.cards ?? [],
              }
            : col
        ),
      };
    });
  }

  function removeColumn(columnId: string) {
    setBoard((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        columns: prev.columns.filter((col) => col.id !== columnId),
      };
    });
  }

  return (
    <div className="flex gap-6 p-6 overflow-x-auto min-h-screen bg-gray-100">
      {board.columns
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((col) => (
          <Column
            key={col.id}
            column={col}
            onUpdate={updateColumn}
            onDelete={removeColumn}
          />
        ))}

      <button
        onClick={addColumn}
        className="h-fit px-4 py-3 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50"
      >
        + Add Column
      </button>
    </div>
  );
}
